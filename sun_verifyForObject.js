/**
 *    Create by Allen.sun on 2020/07/08
 *    Module: sun_verifyForObject.js
 *    Collaborator:
 *    Description: 用于常规的数据检查
 */

// 开发前问题：
// 1 是否需要require 功能？
// 答： 确定需要require功能， 需要做成 1 可配置风格 2 尽可能的自动化。
//      初步的构想： 通过对表单元素指定class来确定元素位置， 并在元素上确定键。动态赋予require 这里可能无法使用框架来实现


// 2 适用的广泛性？ 是否包括， 空值/最大/最小/数据类型/与指定键值发生比较
// 答： 适应性一定要满足灵活和广泛， 不仅需要包含，以上的基本和动态比较， 还需要包含手动比较，和叠加比较。


// 3 工具性质： 1 数据剪裁
// 答： 插件可以带有工具性质。尽量可以满足用户对数据操作的需求


// 4 性能是否最优
// 答：组件尽可能减少遍历次数， 适当引入缓存机制。可大幅度提高组件性能



// 5 可配置性，与易用性
// 答：需要满足灵活的配置， 而且要设置最基础的配置来保证在简单场景下的易用性

// 6 是否可外部配置
// 答： 初步设想， 可以外部导入配置


// 项目架构问题：
// 1 如何架构？ 做vue独有还是独立组件。
// 答： 该组件主要做的是数据的处理和验证。 与其他框架的耦合性需要降低。 但是可以针对框架做一些优化方案

// 2 数据类型分为几类？
// 答： Array/Object/Number/String/Boolean

// 3 代码层面如何架构？
// 答： 洋葱式 程序设计， 核心与外层耦合， 外层功能是内部封装的实现

// 4  Array/Object/Number/String/Boolean 几种基本类型作为核心方法， 那么在校验时有什么异同和难度？
// 答：组件想作为配置插入式的设计，几种作为基础类型，校验的方式也是不同的， 比如 Array的空 和 Object的空 String的空是不同的， 那么就需要同一个内置类型，
// 在不同基本类型下的表现有所不同

// 5 上面所说的插入式设计， 打算如何插入， 考虑没考虑过代码的层级问题。
// 答： 没一个方法都会流出一个口，作为配置传入的入口， 一旦传入则就会生成一个固定的验证config。
// 该config 会实现在第一层级， 不会嵌套进 洋葱式 代码中。




// 灵感：
// 1 针对传入的对象做一个深度检测， 如果对应的值发生改变则实时的动态提示
// 问题： 提示或者 回调的频率， 部分赋值操作 频繁， 有没有解决方式
// 2 数据修正： 当产生错误自动修正为最接近的值

// 开始架构项目

(function ($w) {

    // 组件信息
    var _version = "1.0.0",

        _name = "sun_verifyForObject",

        _facName = "SunVerifyForObject";

    // 内部config
    var _configs = {
        // 私有预设 动作类型翻译
        actionTypeMap: {
            textarea: "书写",
            max: "小于",
            min: "大于",
            select: "选择",
            input: "输入",
            empty: "非空",
            type: "类型"
        },
        rulesFn: {
            Array: {
                empty: function (arr) {
                    return arr.length > 0
                },
                max: function (arr, max, equal, data) {
                    return equal ? arr.length <= max : arr.length < max
                },
                min: function (arr, min, equal) {
                    return equal ? arr.length >= min : arr.length > min
                }
            },
            String: {
                empty: function (val, query) {
                    return val || (query  ? {
                        across: false,
                        text: query
                    } : false)
                },
                max: function (str, max, equal) {
                    return equal ? str.length <= max : str.length < max
                },
                min: function (str, min, equal) {
                    return equal ? str.length >= min : str.length > min
                }
            },

            Number: {
                empty: function (val, query) {
                    return (val > 0) || (query ? {
                        across: false,
                        text: query
                    } : false)
                },
                max: function (num, max, equal) {
                    max = parseFloat(max);
                    return equal ? num <= max : num < max
                },
                min: function (num, min, equal) {
                    min = parseFloat(min);
                    return equal ? num >= min : num > min
                },
                type: function (num, query) {
                    return !isNaN(num) || {
                        across: false,
                        text: query
                    }
                }
            },

            Object: {
                empty: function (obj) {
                    return Object.keys(obj).length > 0
                }
            },

            Date: {

            }
        }
    };

    // 工具对象
    var _utils = {
        _logger: {
            warn: console.warn,
            log: console.log,
            error: console.error
        },
        createLogger: function (title, type, text) {
            _utils._logger[type]("[" + title + " " + type + "]: " + text)
        },
        // 验证类型方法
        typeOf: function (target, type) {
            var shellType = Object.prototype.toString.call(target)
                .replace("[object ", "")
                .replace("]", "");
            if (!type) return shellType;
            if (this.typeOf(type) == "String") return shellType == type;
            if (this.typeOf(type) == "Function") return shellType == type.name;
        },
        betterForEach: function (target, fn) {
            var type = this.typeOf(target);
            if (type == "HTMLCollection") {
                target = Array.prototype.forEach.call(target, function (val, key) {
                    fn(val, key, type)
                });
                return
            };
            if (type !== "Array" && type !== "Object") {
                this.createLogger("betterForEach", "error", "params 1 must be Object or Array");
                return
            }

            for (var key in target) {
                if (fn(target[key], key, type) == "break") {
                    //_utils.createLogger("betterForEach", "log", "betterForEach is break to the loop!");
                    break
                }
            }
        },
        // 合并对象
        // 工具逻辑
        merge: function () {
            var ret = null;
            var args = Array.prototype.slice.call(arguments, 0);
            // function getDeep(args, ret) {
            //     _utils.betterForEach(args, function (tar, key) {
            //         // 如果不是对象则 不进行深度遍历 直接抛出错误， 非对象
            //         var type = _utils.typeOf(tar);
            //        if (type == "Object") {
            //           ret[key] = tar;
            //           getDeep(tar, ret[key]);
            //        } else {
            //            var retValue = ret[key];
            //            // 如果没有值则先赋值操作
            //            if (!retValue && retValue !== 0) {
            //                ret[key] = tar;
            //                return
            //            }
            //            var retType = _utils.typeOf(retValue);
            //            var tarType = _utils.typeOf(tar);
            //
            //            if (retType == "Array") {
            //                if( tarType == "Array") {
            //                    ret[key] = ret[key].concat(tar);
            //                    return
            //                }
            //                ret[key].push(tar);
            //            } else {
            //                 ret[key] = [];
            //                 ret[key].push(retValue);
            //                if( tarType == "Array") {
            //                    ret[key] = ret[key].concat(tar);
            //                    return
            //                }
            //                ret[key].push(tar);
            //            }
            //
            //        }
            //     })
            //     console.log(ret);
            // }
            function _merge(first, second) {
                if (!ret) {
                    ret = second;
                    return
                };

                _utils.betterForEach(second, function (o, key) {
                    // 外部导入的_config 如果跟内部的config产生冲突（都包含）则外部_config会替换响应的值;
                    (_utils.typeOf(o, "Object")) ?
                        _utils.betterForEach(o, function (val, k) {
                            ret[key][k] = val;
                        }) : ret[key] = o;

                })
            }
            _utils.betterForEach(args, function (tar, key) {
                var type = _utils.typeOf(tar);
                if (type !== "Object") {
                    _utils.createLogger("merge", "error", "arguments " + (key + 1) + "must be object got " + type);
                    return false
                };
                _merge(ret, tar)

            });
            return ret
        },
        _noop: function () { },
        _timeoutShell: function (fn, time) {
            var _this = this;
            var timer = setTimeout(function () {
                fn.call(_this);
                clearTimeout(timer);
            }, time || 200)
        },
        _scrollAnimation(rect, el) {
            function getPos(obj) {
                var l = 0, t = 0;
                while (obj) {
                    l += obj.offsetLeft;
                    t += obj.offsetTop;
                    obj = obj.offsetParent;
                }
                return { left: l, top: t };
            }
            window.scroll({
                top: getPos(el).top - 300,
                behavior: 'smooth'
            });
        },
        _computedTarPos(tar) {
            return {
                top: tar.offsetTop,
                left: tar.offsetLeft
            }
        }
    };


    window._sun_utils = _utils;

    // 核心代码库
    var _core = {

        _proxyCenter: function (tarObj, cb, defaultKey) {
            var _this = this;
            var tarType = _utils.typeOf(tarObj);
            var isArray = tarType == "Array";
            var isObject = tarType == "Object";

            if (!isArray && !isObject) return;

            _utils.betterForEach(tarObj, function (val, key) {

                var valType = _utils.typeOf(val);

                //if (isArray) tarObj[key] = _core._proxy_Array(val, cb, key);

                if (valType == "Object") {
                    tarObj[key] = _core._proxy_Object(val, _core._proxyHandler(_this, isArray ? key : "")); // 如果是请求代理是数组则传响应的index(key)
                    _core._proxyCenter.call(_this, tarObj[key], cb);
                }

                if (valType == "Array") {
                    // Note: 这里需要优化
                    // 对象下面的数组进行代理, 传入数组的
                    tarObj[key] = _core._proxy_Array(val, function (val, key, arr, codeType, b, index) {
                        cb.call(_this, "").apply(_this,[arr, key, arr, arr, index]);
                    }, defaultKey || key);
                    _core._proxyCenter.call(_this, tarObj[key], cb, key);
                }
            });
            // 如果是数组状态产生的代理， 则需要在长度发生变化时， 重新进行reload；
            return isArray ? _core._proxy_Array.call(this,tarObj, _core._proxy_Array_reload.bind(_this)) : _core._proxy_Object(tarObj, _core._proxyHandler(_this))
        },
        _proxy_Object: function (object, handler) {
            if (!_utils.typeOf(object, "Object")) return object;
            return new Proxy(object, handler)
        },
        _proxy_Array: function (array, cb, key) {
            var _this = this;
            if (!_utils.typeOf(array, "Array")) return array;
            return new Proxy(array, {
                set: function (tar, index, value, receiver) {
                    if (_utils.typeOf(value, "Object")) {
                        index !== "__proto__" && (value = _core._proxy_Object(value, _core._proxyHandler(_this, index)));
                    }
                    var r = Reflect.set(tar, index, value, receiver);
                    var cbType = _utils.typeOf(tar, "Array") ? 'modify' : 'create';

                    if (index !== 'length') {
                        cb(value, key, array, cbType, true, index);
                    } else {
                        //_this.config.swicthRequire && _core.requireEngine.resetRequire.call(_this);
                    }
                    return true
                }
            })
        },
        _proxy_Array_reload: function () {
            var _this = this;
            _utils._timeoutShell(function () {
                _core.requireEngine._initRequire.call(_this);
            }, 200)
        },
        // 代理handler核心
        _proxyHandler: function (scope, index) {
            return {
                set: _codeLib.handler_set.call(scope, index),
                get: _codeLib.handler_get.bind(scope)
            }
        },
        // 校验核心
        _validate: {
            // 类型转换中心
            validateTypeCenter: function (ruleItem, val, data, itemkey, index, closeRequire) {
                // 获取验证规则
                var ruleFns = ruleItem.rules;
                // 获取基础类型
                var ruleType = ruleItem.type.name;
                // 获取动作类型
                var actionType = ruleItem.actionType;
                var ret = this.validateTypeRulerMap[ruleType].call(this, ruleFns, val, data || this._curObj, itemkey);
                if (ret) {
                    var isHandleErr = ret.handleErr;
                    ret.labelText = ruleItem.labelText;
                    ret.text = (isHandleErr ? "" : (ret.labelText + this.actionTypeMap[actionType] + "必须")) + ret.text;

                    _core.requireEngine.goRequire.call(this, itemkey, index, ret.text, closeRequire)
                } else {
                    this.requireErrList &&
                    this.requireErrList.indexOf(itemkey) >= 0 &&
                    _core.requireEngine.clearRequire.call(this, itemkey, index)
                };
                return ret
            },
            //基本类型校验中心， 初始化时即生成闭包
            validateTypeRulerMap: function (packages) {
                var ret = {};
                _utils.betterForEach(packages, function (package, key) {
                    ret[key] = (function (package) {
                        return function (targetRules, value, data, itemkey) {
                            return _core._validate.validateLoop.apply(this, [package, targetRules, value, data, itemkey]);
                        }
                    })(packages[key]);
                });
                return ret
            },
            // 循环校验
            validateLoop: function (package, targetRules, value, data, itemkey) {
                var text = "", _this = this, actionTypeMap = _this.actionTypeMap, ruleMap = _this.rules, retObj = {};
                _utils.betterForEach(targetRules, function (ruleText, key) {

                    // 首先需要判断预填写的值
                    var kvArr = [], key, defaultValue, equal, across = true, handleFn = false;
                    // 分发类型
                    var ruleTextType = _utils.typeOf(ruleText);

                    if (ruleTextType == "String") {
                        kvArr = ruleText.split(":");
                        key = kvArr[0];
                        defaultValue = kvArr[1];
                        if (defaultValue) {
                            var reg = new RegExp("=", "g");
                            equal = defaultValue.indexOf("=") >= 0;
                            defaultValue = defaultValue.replace(reg, "");

                        }

                        if (!package[key]) {
                            _utils.createLogger("validateLoop", "warn", " options config rulesFn not include verify type [" + key + "] ! please check it");
                            return
                        }

                        across = package[key].call(this, value, defaultValue, equal, data);
                    } else if (ruleTextType == "Function") {
                        across = ruleText(value, data);
                    } else {
                        _utils.createLogger("svf", "warn", "options config rulesFn " + ruleText + " must be String or Function, got " + ruleTextType + " at params " + key + ", has been skipped!");
                        across = true;
                    };

                    if (_utils.typeOf(across, "Object")) {

                        text = across.text;
                        retObj.handleErr = true;
                        retObj.targetKey = itemkey;
                        !across.across && (retObj.text = text);
                        across = across.across;
                    };

                    if (!across) {
                        if (!retObj.handleErr) {
                            retObj.text = actionTypeMap[key] + (equal ? "等于" : "") + (defaultValue ? defaultValue : "");
                            retObj.errType = key;
                            _utils.typeOf(equal, Boolean) && (retObj.equal = equal);
                            defaultValue && (retObj.defaultValue = defaultValue);
                        };
                        return "break"
                    };
                });

                return retObj.text ? retObj : null;
            }
        },
        // eventLoop
        _eventLoop: {
            createLoop: function () {
                this.eventLoop = {};
            },
            mounteLoop: function (eventName, callback) {
                this.eventLoop[eventName] = callback;
            },
            getEvents: function () {
                return this.eventLoop
            },
            $emit: function (name, query) {
                var events = _core._eventLoop.getEvents.call(this);
                events[name](query)
            }
        },
        // 挂载规则相关配置
        _mounteRuleConfigs: function () {
            var outSideConfigsType = _utils.typeOf(this.outSideConfigs);
            //外部配置： 类型重置
            if (outSideConfigsType == "Undefined") {
                this.outSideConfigs = {};
            } else if (outSideConfigsType !== "Object") {
                this.outSideConfigs = {};
                _utils.createLogger("svf", "warn", "outSideRulesConfig must be object");
            }
            var outsideRuleFn = this.outSideConfigs.rulesFn || {};
            var outsideActionTypeMap = this.outSideConfigs.actionTypeMap || {};


            // 使用私有 config rules
            this.mergeRulesFn = this.config.switchOutsideRules ?
                _utils.merge(_configs.rulesFn, outsideRuleFn) :
                _configs.rulesFn;
            //组合actionTypeMap
            this.actionTypeMap = this.config.switchOutsideRules ?
                _utils.merge(_configs.actionTypeMap, outsideActionTypeMap) :
                _configs.actionTypeMap;
            // 挂载validateTypeRulerMap
            this.validateTypeRulerMap = _core._validate.validateTypeRulerMap(this.mergeRulesFn);
        },
        // require
        requireEngine: {
            _initRequire: function () {
                // 判断配置中的require
                var config = this.config || {};
                var needRequire = config.swicthRequire;
                var requireOption = {}, mainClass = void 0, requireClass = void 0;
                if (!needRequire) return;
                requireOption = config.requireOption || null;
                if (!requireOption) {
                    _utils.createLogger("svf", "warn", "you opened the function require set true, you must set option requireOption!");
                    return
                }
                requireClass = requireOption.requireClass;
                mainClass = requireOption.mainClass;
                if (!mainClass || !requireClass) {
                    _utils.createLogger("svf", "warn", "you must set mainClass and requireClass, call me how to do it");
                    return
                };
                _core.requireEngine.getRquiredEls.call(this, mainClass, requireClass);
            },
            getRquiredEls: function (mainClass, requireClass) {
                var mainElsMap = {};
                var requiredElsMap = {};

                var mainEls = document.getElementsByClassName(mainClass);
                var requiredEls = document.getElementsByClassName(requireClass);

                //处理requiredom
                _utils.betterForEach(mainEls, function (el, index) {
                    var dateset = el.dataset;
                    var verflykey = dateset.verflykey;
                    var verValueType = dateset.vervaluetype;
                    var valueType = _utils.typeOf(mainElsMap[verflykey], "Array");
                    verValueType == "array" ? valueType ? mainElsMap[verflykey].push(el) : mainElsMap[verflykey] = [el] : mainElsMap[verflykey] = el;
                });
                _utils.betterForEach(requiredEls, function (el, index) {
                    var dateset = el.dataset;
                    var requirekey = dateset.requirekey;
                    var verValueType = dateset.vervaluetype;
                    var valueType = _utils.typeOf(requiredElsMap[requirekey], "Array");
                    verValueType == "array" ? valueType ? requiredElsMap[requirekey].push(el) : requiredElsMap[requirekey] = [el] : requiredElsMap[requirekey] = el
                });
                this.mainElsMap = mainElsMap;
                this.requiredElsMap = requiredElsMap;
                this.requireErrList ? "" : this.requireErrList = [];
                this._requireInited = true;
            },
            goRequire: function (key, index, text, closeScroll) {
                if (!this._requireInited) return;
                var mEl = void 0, rEl = void 0;
                var els = this.mainElsMap[key];
                var rls = this.requiredElsMap[key];
                (index && index >= 0) ? mEl = (els ? els[index] : void 0 ): mEl = els;
                (index && index >= 0) ? rEl = (els ? rls[index] : void 0 ): rEl = rls;
                if (mEl) {
                    !closeScroll && _core.requireEngine.setTip(mEl);
                    !closeScroll && this.requireErrList.indexOf(key) == -1 && this.requireErrList.push(key);
                    !closeScroll && _core.requireEngine.scrollToEl(mEl);
                };

                if (rEl) {
                    !closeScroll && _core.requireEngine.setRequire(rEl, text);
                }
            },
            clearRequire: function (key, index) {
                var mEl = void 0, rEl = void 0;
                var els = this.mainElsMap[key];
                var rls = this.requiredElsMap[key];

                (index && index >= 0) ? mEl = (els ? els[index] : void 0 ): mEl = els;
                (index && index >= 0) ? rEl = (els ? rls[index] : void 0 ): rEl = rls;

                _core.requireEngine.setTip(mEl, true);
                _core.requireEngine.setRequire(rEl, "", true);
            },
            setTip: function (el, clear) {
                if (!el) return;
                if (!clear) {
                    // el.style.outline = "none"
                    el.style.borderColor = "#F56C6C"
                } else {
                    el.style.borderColor ="#ddd"
                }
            },
            setRequire: function (el, text, clear) {
                if (!el) return;
                if (!clear) {
                    el.innerText = text;
                    el.style.color = "#F56C6C";
                } else {
                    el.innerText = "";
                }
            },
            scrollToEl: function (el) {
                var pos = _utils._computedTarPos(el);
                _utils._scrollAnimation(pos, el)
            },
            resetRequire: function () {
                function clearEls(el) {
                    if (el) {
                        _core.requireEngine.setTip(el, true, "#ddd")
                    }
                }
                function clearRls() {

                }
                _core.requireEngine._initRequire.call(this);
                _utils.betterForEach(this.mainElsMap, function (item) {
                    if (_utils.typeOf(item, Array)) {
                        _utils.betterForEach(item, function (innner) {
                            clearEls(innner)
                        })
                    } else {
                        clearEls(item)
                    }

                });

            }
        }
    };

    // 私有基本代码库;
    var _codeLib = {
        createFac: function () {
            var _this = this;
            return function (curObj, options) {
                _this.init.call(this, options, curObj);
                return
            }
        },
        init: function (options, curObj) {
            // 初始化eventLoop
            _core._eventLoop.createLoop.call(this);
            // 取出规则数组
            this.rules = options.rules;
            // 出去配置
            this.config = options.config || {};

            // 取出私有规则配置
            this.outSideConfigs = this.config.outSideRulesConfig;

            _core._mounteRuleConfigs.call(this);

            //设置代理
            curObj = _core._proxyCenter.call(this, curObj, _codeLib.handler_set.bind(this));

            this._curObj = curObj;
        },
        handler_set: function (index) {
            return function (target, key, value, receiver, fromSet, scope) {
                var rule = this.rules && this.rules[key], ret;
                var r = Reflect.set(target, key, value, receiver);
                if (!rule || "__proto__" == key) return;
                this.startTest &&
                // 这里的逻辑在于set的作用域中是否存在index 如果存在index则 是数组代理， 需要额外提取对象
                (ret = _core._validate.validateTypeCenter.call(this, rule, value, index >= 0 ? this._curObj[index] : this._curObj, key, index));
                ret && _core._eventLoop.$emit.call(this, "tirrger", ret);
                if (fromSet) return;
                return r;
            }.bind(this)
        },
        handler_get: function (val, key) {
            return val[key]
        },
        // note: if runtime form Array function will get index param;
        // The parameter (index) is used to find the require local;
        _testObject: function (object, index, closeRequire) {
            var across = true, _this = this;
            _utils.betterForEach(object, function (val, key) {
                var rule = _this.rules[key], ret;
                if (!rule) return;
                ret = _core._validate.validateTypeCenter.call(_this, rule, val, object, key, index, closeRequire);
                if (ret) {
                    across = false;
                    !closeRequire && _core._eventLoop.$emit.call(_this, "tirrger", ret);
                    return "break"
                }
            });
            return across
        }
    };

    // 外部方法库
    var codeLib = {
        test: function (closeRequire) {
            var _this = this, curType = _utils.typeOf(this._curObj), across;
            this.startTest = true;
            // 初始化require相关逻辑
            _core.requireEngine._initRequire.call(this);
            if (curType == "Object") {
                across = _codeLib._testObject.call(_this, this._curObj, -1,closeRequire)
            } else if (curType == "Array") {
                _sun_utils.betterForEach(this._curObj, function (val, index) {
                    across = _codeLib._testObject.call(_this, val, index, closeRequire);
                    if (!across) return "break"
                });
            } else {
                _sun_utils.createLogger("svf", "warn", "you must insert Object/Array got " + curType)
            }

            return across
        },
        $on: function (eventName, callback) {
            _core._eventLoop.mounteLoop.apply(this, [eventName, callback]);
        },
        getObject: function () {
            return this._curObj
        }
    };



    // 决定使用new 关键字。 考虑再三可能会有多个对象分别验证的情况， 这里需要做一个缓存。
    // 挂载函数
    $w[_facName] = _codeLib.createFac();
    // 挂载原型对象， 但是不想暴露私有方法
    $w[_facName].prototype = codeLib;

})(window);
