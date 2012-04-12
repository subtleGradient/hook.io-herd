#!/usr/bin/env node
/*jshint asi:true*/

if (module.id == '.') process.nextTick(function(){
  
  new Herd({ configFilePath:'../example/simpsons.config.json' }).start()
  
})

var Hook = require('hook.io').Hook
var util = require('util')
var path = require('path')

exports.Herd = Herd
util.inherits(Herd, Hook)

Herd.prototype.noConfig = true // don't try to load ./config.json
Herd.prototype.autoheal = true // stay alive unless explicitly killed
Herd.prototype.ignoreSTDIN = true
Herd.prototype.childHooks = null // array of child hook configs
Herd.prototype.configFilePath = null

Herd.prototype.configFrom = function(config){
  if (config.configFilePath) {
    var configFilePath = config.configFilePath
    var resolvedPath = path.resolve(path.dirname(this.configFilePath || __filename), config.configFilePath)
    
    config = require(resolvedPath)
    config.configFilePath = resolvedPath
  }
  else config.configFilePath = null
  return config
}

function Herd(config){
  var herd = this
  Hook.call(herd, herd.configFrom(config))
  
  herd.childHooks = [].concat(herd.childHooks)
  herd.childHooks = herd.childHooks.map(herd.configFrom, herd)
  
  herd.on('hook::ready', function(){
    if (herd.childHooks && herd.childHooks.length) {
      herd.spawn(herd.childHooks)
    }
  })
}
