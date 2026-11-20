nci-analysis-tools-web-presence

Contains shared resources for lightweight web applications and RESTful services for analysis tools written by the NCI intramural scientists.

## Infrastructure validation

The CDK stack tests synthesize templates offline with placeholder AWS values:

```sh
cd infrastructure
npm ci
npm run build -- --noEmit
npm test -- --runInBand
```
