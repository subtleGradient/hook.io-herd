#!/usr/bin/env node
/*jshint asi:true*/

if (module.id == '.') process.nextTick(function(){
  
  new Herd({ configFilePath:require.resolve('../example/simpsons.config.json') }).start()
  
})

var Hook = require('hook.io').Hook
var util = require('util')

exports.Herd = Herd
function Herd(config){
  var herd = this
  Hook.call(herd, herd.configFrom(config))
  
  if (!(herd.childHooks && Array.isArray(herd.childHooks))) herd.childHooks = []
  herd.childHooks = herd.childHooks.map(herd.configFrom, herd)
  
  herd.on('hook::ready', function(){
    herd.listening = true // workaround hook.io bug
    if (herd.childHooks && herd.childHooks.length) {
      herd.spawn(herd.childHooks)
    }
  })
}

util.inherits(Herd, Hook)

Herd.prototype.configFilePath = null
  
Herd.prototype.src = null
  
Herd.prototype.type = null
  
// don't create blank config.json files all over the place
Herd.prototype.noConfig = true
  
// stay alive unless explicitly killed
Herd.prototype.autoheal = true
  
Herd.prototype.ignoreSTDIN = true
  
// array of child hook configs
Herd.prototype.childHooks = null
  
Herd.prototype.configFrom = function(config){
  if (!config.configFilePath) return config
  
  // All this magical nonsense is necessary to allow type, src and configFilePath properties to be relative to their parent config
  
  var parentModule = this.configFilePath ? requireModule(this.configFilePath) : config.parentModule
  var mod = requireModule(config.configFilePath, parentModule)
  mod.exports.configFilePath = mod.filename
  
  // Starting from the config module, resolve the src or type
  
  if (mod.exports.type) {
    mod.exports.src = 'hook.io-' + mod.exports.type
    delete mod.exports.type
  }
  if (mod.exports.src) {
    mod.exports.src = Module._resolveFilename(mod.exports.src, mod)
  }
  
  return mod.exports
}

////////////////////////////////////////////////////////////////////////////////

var Module = require('module')

requireModule._cache = {}
function requireModule(filename, parent){
  filename = filename.replace(/^~/, process.env.HOME)
  if (requireModule._cache[filename]) return requireModule._cache[filename]
  var module = new Module(filename)
  requireModule._cache[filename] = module
  if (!module.loaded) module.load(Module._resolveFilename(filename, parent))
  return module
}
