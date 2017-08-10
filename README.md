[![Build Status](https://travis-ci.org/gavinr/koop-provider-nba.svg?branch=master)](https://travis-ci.org/gavinr/koop-provider-nba)


# Koop NBA Provider

This is a Koop Provider that exposes NBA Shot Charts as Feature Services, to be used throughout the ArcGIS platform.

## Test it out
Run server:
- `npm install`
- `npm start`

Example API Query:
- `curl localhost:8080/nba/201566/FeatureServer/0/query?returnCountOnly=true`

Player names also work (last name first):
- `curl localhost:8080/nba/201566/FeatureServer/0/query?returnCountOnly=true`

Tests:

(not currently working)

- `npm test`

## Deployment Notes

- Note that the NBA Stats API seems to block Amazon AWS, Heroku, and maybe other cloud VM providers. More info [here](https://github.com/bttmly/nba/issues/41#issuecomment-294879571).