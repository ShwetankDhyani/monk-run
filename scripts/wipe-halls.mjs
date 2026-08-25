#!/usr/bin/env node
import { clearHalls, getLeaderboardStoreInfo } from '../server/hallStore.mjs'

const info = getLeaderboardStoreInfo()
const halls = await clearHalls()
console.log(`Wiped hall records (${info.kind}${info.path ? `: ${info.path}` : ''})`)
console.log(JSON.stringify(halls, null, 2))
