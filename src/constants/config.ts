import argv from 'minimist'
import { config } from 'dotenv'
import path from 'path'

const options = argv(process.argv.splice(2))

export const isProduction = options.env === 'production'
config({
  path: options.env ? `.env.${options.env}` : '.env'
})

export const envConfig = {
  APP_PORT: (process.env.APP_PORT as string) || 4000,
  APP_HOST: process.env.APP_HOST as string,
  DB_NAME: process.env.APP_HOST as string,
  DB_USERNAME: process.env.DB_USERNAME as string
}
