## AI created Market Research Reports 

This repository provides the home application for the collections of the AI Market Research Reports using Vue.js and AWS Amplify.

## PRD

### Considerations
- No / Low startup knowledge required 
- WYSIWYG: quick turn around to see the rendered website in production.
- Headless / One-key deployment
- Local dev
- Team cooperation
- Hosting cost controls
  - Compute, ingress, storage cost breakdown
  - Circuit breaker for running away activities and costs
- Open source, No vendor locked in

### website

- landing pages: home, market research reports, services, about
- Data/ assets hosting
  - reports repo
  - user databases
- auth: user sign-up, sign-in, account settings,
- components: 
  - "contact us" form
  - Email link to download reports
  - Account registration, update, delete, reset passwords

## Associated Domain Name - www.d2ai.info

The application is associated to the domain name d2ai.info already.
A new commit to the **main** branch will be automatically deployed.

## Overview

### App Architecture
The application queries all of the market research reports available (stored in the backend cloud storage, AWS S3), and lists them as **Card** UI components.
Each Card component includes the report title, an abstract, and a **Button** to allow the download of the full report in PDF.

### AWS Amplify Vue.js Vuetify
This application is a Vue (Vue 3) application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/vue/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
