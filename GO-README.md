<p align="center">
  <img src="https://user-images.githubusercontent.com/31465/34380645-bd67f474-eb0b-11e7-8d03-0151c1730654.png" height="29" />
</p>
<p align="center">
  <i>A fast, collaborative, knowledge base for your team built using React and Node.js.<br/>Try out Outline using our hosted version at <a href="https://www.getoutline.com">www.getoutline.com</a>.</i>
  <br/>
  <img width="1640" alt="screenshot" src="https://user-images.githubusercontent.com/380914/110356468-26374600-7fef-11eb-9f6a-f2cc2c8c6590.png">
</p>
<p align="center">
  <a href="https://circleci.com/gh/outline/outline" rel="nofollow"><img src="https://circleci.com/gh/outline/outline.svg?style=shield&amp;circle-token=c0c4c2f39990e277385d5c1ae96169c409eb887a"></a>
  <a href="http://www.typescriptlang.org" rel="nofollow"><img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat" alt="Prettier"></a>
  <a href="https://github.com/styled-components/styled-components"><img src="https://img.shields.io/badge/style-%F0%9F%92%85%20styled--components-orange.svg" alt="Styled Components"></a>
  <a href="https://translate.getoutline.com/project/outline" alt="Localized"><img src="https://badges.crowdin.net/outline/localized.svg"></a>
</p>

This is the source code that runs [**Outline**](https://www.getoutline.com) and all the associated services. If you want to use Outline then you don't need to run this code, we offer a hosted version of the app at [getoutline.com](https://www.getoutline.com).

If you'd like to run your own copy of Outline or contribute to development then this is the place for you.

# Installation

Please see the [documentation](https://app.getoutline.com/share/770a97da-13e5-401e-9f8a-37949c19f97e/) for running your own copy of Outline in a production configuration.

If you have questions or improvements for the docs please create a thread in [GitHub discussions](https://github.com/outline/outline/discussions).

## Prerequisites
- Git
- Yarn
- [Node.js](https://nodejs.org/en/) (v16 LTS preferred)

### Download
```
  git clone https://github.com/tranquangvu/outline.git
```
### Configuration
1. Register at least one authentication provider to get key
    - [Google](https://wiki.generaloutline.com/s/hosting/doc/google-hOuvtCmTqQ) (must be Google Workspace account)
      ```
      GOOGLE_CLIENT_ID= 
      GOOGLE_CLIENT_SECRET=
      ```
    - [Microsoft / Azure](https://wiki.generaloutline.com/s/hosting/doc/microsoft-azure-UVz6jsIOcv)
      ```
      AZURE_CLIENT_ID=
      AZURE_CLIENT_SECRET=
      AZURE_RESOURCE_APP_ID=
      ```
    - [Slack](https://wiki.generaloutline.com/s/hosting/doc/slack-sgMujR8J9J)
      ```
      # This is called "Client ID" in Slack
      SLACK_KEY=

      # This is called "Client Secret" in Slack
      SLACK_SECRET=
      ```
    - ...
  
    Read more [here](https://wiki.generaloutline.com/s/hosting/doc/authentication-7ViKRmRY5o)
2. Create `.env` file from `.env.example` file
3. Update environment values as above


## From Docker

### Dependencies
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Setup
1. Run docker for external services (postgres, redis, fake s3):

```
  docker-compose up
```

2. Yarn install:

```
  yarn install
```

3. Run migrations & others settings

```
  yarn sequelize db:migrate
  yarn copy:i18n
```

4. Start dev server

```
  yarn dev:watch
```

5. Visit `http://localhost:3000`

## From source

### Dependencies
- [Postgres](https://www.postgresql.org/) (>=9.5)
- [Redis](https://redis.io/) (>=4)

### Setup
1. Yarn install:
```
  yarn install
```

2. Setup database
```
  # Must start Postgres

  yarn sequelize db:create
  yarn sequelize db:migrate
```

4. Create SSL certificate (only for Slack authentication)
    - Install mkcert
      ```
        brew install mkcert
        mkcert -install
      ```
    - Create SSL for `localhost`
      ```
        mkcert localhost
      ```
    - Rename
        - localhost.pem => public.pem
        - localhost-key.pem => private.pem
    - Copy `public.pem`, `private.pem` to `outline` folder
  
5. Running
```
  # Must start Redis

  yarn dev:watch
```

6. Visit `http://localhost:3000`

# Development

There is a short guide for [setting up a development environment](https://app.getoutline.com/share/770a97da-13e5-401e-9f8a-37949c19f97e/doc/local-development-5hEhFRXow7) if you wish to contribute changes, fixes, and improvements to Outline.

## Contributing

Outline is built and maintained by a small team – we'd love your help to fix bugs and add features!

Before submitting a pull request _please_ discuss with the core team by creating or commenting in an issue on [GitHub](https://www.github.com/outline/outline/issues) – we'd also love to hear from you in the [discussions](https://www.github.com/outline/outline/discussions). This way we can ensure that an approach is agreed on before code is written. This will result in a much higher liklihood of your code being accepted.

If you’re looking for ways to get started, here's a list of ways to help us improve Outline:

- [Translation](docs/TRANSLATION.md) into other languages
- Issues with [`good first issue`](https://github.com/outline/outline/labels/good%20first%20issue) label
- Performance improvements, both on server and frontend
- Developer happiness and documentation
- Bugs and other issues listed on GitHub

## Architecture

If you're interested in contributing or learning more about the Outline codebase
please refer to the [architecture document](docs/ARCHITECTURE.md) first for a high level overview of how the application is put together.

## Debugging

In development Outline outputs simple logging to the console, prefixed by categories. In production it outputs JSON logs, these can be easily parsed by your preferred log ingestion pipeline.

HTTP logging is disabled by default, but can be enabled by setting the `DEBUG=http` environment variable.

## Tests

We aim to have sufficient test coverage for critical parts of the application and aren't aiming for 100% unit test coverage. All API endpoints and anything authentication related should be thoroughly tested.

To add new tests, write your tests with [Jest](https://facebook.github.io/jest/) and add a file with `.test.js` extension next to the tested code.

```shell
# To run all tests
make test

# To run backend tests in watch mode
make watch
```

Once the test database is created with `make test` you may individually run
frontend and backend tests directly.

```shell
# To run backend tests
yarn test:server

# To run a specific backend test
yarn test:server myTestFile

# To run frontend tests
yarn test:app
```

## Migrations

Sequelize is used to create and run migrations, for example:

```shell
yarn sequelize migration:generate --name my-migration
yarn sequelize db:migrate
```

Or to run migrations on test database:

```shell
yarn sequelize db:migrate --env test
```

## License

Outline is [BSL 1.1 licensed](LICENSE).
