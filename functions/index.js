const admin = require('firebase-admin')
admin.initializeApp()

const { checkWeather } = require('./checkWeather')
const { generateWeeklyTasks } = require('./generateWeeklyTasks')
const { dailyDigest } = require('./dailyDigest')
const { generateDailyTasks } = require('./generateDailyTasks')

exports.checkWeather = checkWeather
exports.generateWeeklyTasks = generateWeeklyTasks
exports.dailyDigest = dailyDigest
exports.generateDailyTasks = generateDailyTasks
