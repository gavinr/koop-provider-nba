/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/specs/provider/
*/
const proj4 = require('proj4')
const moment = require('moment')
const request = require('request').defaults({gzip: true, json: true})
const config = require('config')
const ttl = (config.nba && config.nba.ttl) || 60 * 60

function Model (koop) {}

// This is the only public function you need to implement
Model.prototype.getData = function (req, callback) {
  // Call the remote API with our developer key
  const userAgent = config.nba.userAgent
  const playerId = req.params.id
  console.log('playerId', playerId)
  request({
    url: `http://stats.nba.com/stats/shotchartdetail?AheadBehind=&CFID=&CFPARAMS=&ClutchTime=&Conference=&ContextFilter=&ContextMeasure=FGM&DateFrom=&DateTo=&Division=&EndPeriod=10&EndRange=28800&GameEventID=&GameID=&GameSegment=&GroupID=&GroupQuantity=5&LastNGames=0&LeagueID=00&Location=&Month=0&OpponentTeamID=0&Outcome=&PORound=0&Period=0&PlayerID=${playerId}&PlayerPosition=&PointDiff=&Position=&RangeType=0&RookieYear=&Season=&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&StartPeriod=1&StartRange=0&StarterBench=&TeamID=0&VsConference=&VsDivision=`,
    headers: {
      'User-Agent': userAgent
    }
  }, (err, res, body) => {
    if (err) return callback(err)
    // translate the response into geojson
    const geojson = translate(body)

    geojson.ttl = ttl
    geojson.metadata = {
      name: `${playerId}`
    }
    // hand off the data to Koop
    callback(null, geojson)
  })
}

function translate (input) {
  // turn resultSets[0].headers and resultSets[0].rowSet into objects:
  const featureObjects = input.resultSets[0].rowSet.map((rowSetItem) => {
    const retObj = {}
    rowSetItem.forEach((value, i) => {
      retObj[input.resultSets[0].headers[i]] = value
    })
    return retObj
  })

  return {
    type: 'FeatureCollection',
    features: featureObjects.map(formatFeature)
  }
}

function formatFeature (shotObject) {
  // Most of what we need to do here is extract the longitude and latitude.
  // For ease of coordination with our "basketball court basemaps", we want to assume the points coming from the
  // API are in web mercator. But koop assumes GeoJSON which assumes WGS84, so lets re-project.
  // Also note that the NBA API returns the X coordiate in revers, so multiply by -1.
  const pt = proj4('EPSG:3857', 'EPSG:4326', [-1 * shotObject.LOC_X, shotObject.LOC_Y])
  const feature = {
    type: 'Feature',
    properties: shotObject,
    geometry: {
      type: 'Point',
      coordinates: pt
    }
  }

  // Convert "GAME_DATE" to a proper date, and also calculate SEASON:
  const gameDate = moment(feature.properties['GAME_DATE'])
  feature.properties.GAME_DATE = gameDate.toISOString()
  feature.properties.SEASON = getSeason(gameDate)

  return feature
}

/**
 * Returns the "year" of the season. Just a single year (the year that the season ENDS with)
 * @param {object} date - momentjs date object
 */
function getSeason(date) {
  const month = date.month() + 1
  const year = date.year()

  if(month > 8) {
    return year + 1;
  } else {
    return year;
  }
}

module.exports = Model
