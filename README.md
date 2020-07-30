### verfyForObject


###### verfyForObject是用来做什么的？
由于本人公司行业的原因，在日常的开发过程中会有很多的大量简历相关的表单， 表单验证的准确性和多变性， 提示的友好性， 如果没有插件的接入来专门做这些工作，将会产生大量的判断代码， 开发周期也会变长 并且很容易出BUG。
verfyForObject这个插件就是专门来解决复杂验证的。

项目地址
[https://github.com/allensunjian/sun_verifyForObject](https://github.com/allensunjian/sun_verifyForObject)

详细配置和说明见demo: [https://github.com/allensunjian/sun_verifyForObject/tree/master/demo_array](https://github.com/allensunjian/sun_verifyForObject/tree/master/demo_array)

**说明： 本插件是在工作中输出的，难免有考虑不全的情况，有任何疑问或建议欢迎联系QQ191144567**

###### verfyForObject是能做什么？
    1.  可以验证数据，并返回错误信息
    2.  提供多种自定义验证规则的方式
    3. 线性验证方式， 同一字段可配置多个线性规则， 实现复杂验证
    4. 支持数据对象和数组，包括数组对象的验证
    5. 适应性强， 可结合目前市面上大多数的数据驱动框架使用， 实现动态验证
    6. require功能， 可绑定页面元素，实现绑定页面提示文字， 表单item标红， 并自动滚动到目标位置
    7 外部验证规则可导入
    8 动作类型可配置
   
##### 效果演示
![3912a4caf537a8aef62cab21e0b3772c.gif](en-resource://database/563:1)

##### 配置/说明

构造函数： SunVerifyForObject
```
 SunVerifyForObject（targetObj,configObj);
```
targetObj说明：
该参数是需要被验证的目标， 可以为对象也可以为数组；


configObj说明： 

configObj说明包含两个字段config和rules；

config是配置插件公用配置和外部规则配置相关

rules是定义configObj规则的配置；


configObj完整配置如下：
```
{    
    config: {        
        swicthRequire: true,        // 开启页面require
        requireOption: {            // require配置
            mainClass: "sun_verify",            // 需要border标红的元素 class
            requireClass: "sun_verify_require"        // 需要显示红色提示文字的元素 class
        },        
        switchOutsideRules: true,        // 是否开启外部配置， switchOutsideRules 是true时，插件会读取outSideRulesConfig中的
                                                    actionTypeMap/rulesFn 配置 并和内置项目组合到一起， 如果规则（rulesFn） 或者动作                                                        （actionTypeMap）和内置的产生重复 则outSideRulesConfig中的配置会覆盖掉内置配置。
        outSideRulesConfig: {            // 外部配置 switchOutsideRules为true时生效
            actionTypeMap:{              // 定义动作类型， 系统会通过该配置自动生成提示动作 内置动作： input(输入)/select（选择)/
                                                empty(非空）/
                add: "添加的"            
              } ，
              rulesFn： {                    // 外部规则配置，
                    Number: {               // 指定规则类型， 目前规则的类型分为 Number/String/Array/Object
                        phone: function (val) {    // 自定义规则 函数内会返回一个待验证的值，手动验证之后根据结构返回
                                                         true或者false 抑或 返回一个对象包含自定义提示文字(across置为 false,                                                                text 自定义错误提示)
                              return (isNaN(val) || val.length !== 11) ? {
                              across: false,
                               text: "手机号格式不正确"
                             } : true;
                          }
                    }
              }
        }   
    },    
    rules: {        // 为 检测的目标设置规则
        name: {            
            type: String,                                                    // 指定验证类型
             rules: ["asd:123","empty", "max:10=", "min:2="],    // 指定验证规则 
            labelText: "名称",                                            // 字段在页面中的名称
             actionType: "input"                                        // 指定动作类型
        } ，
        phoneNum: {
            type: Number,
            rules: ["type:手机号输入必须是数字", "phone"],
            labelText: "电话号码",
            actionType: "input"
        }
    }
}


```

内置类型说明：
1 "empty" 非空 
2 "max" 最大值
3 "min" 最小值
4 "type" 数据类型 （会根据type字段自动匹配）
内置类型描述： 
1 ":" 冒号， 为指定对比的值， 如"max:10" 意为 最大不能超过10（不包含10） min同理。 冒号也可以指定类型的提示文字为手动。如 empty:请输入XXXXX
2 “=”等号， 为指定是否等于该值 如： "max:10=" 最大不能超过10 （包含10）min同理


外部导入验证类型： 

config ---》outSideRulesConfig ---》actionTypeMap 
-----》
添加---验证类型（Array/Number/String/Object） 目前四种类型；
-----》
指定规则名称和函数；

如下
```
{
config： {
        outSideRulesConfig： {
            actionTypeMap： {
                 // 指定在String 类型下添加规则
                String: {
                    handleRule: function (val) { //会返回目标对象内对应需要验证的值
                        if (val.length < 20) {
                            return {
                                across: false,
                                text: "自定义规则不能小于20"
                            }
                        }
                        
                        return true
                    }
                }
            }
        }
    }，
    
    rules: {
            name: {
                type: String，
                rules: ["handleRule", function (val) {  
                  // 也可以通过直接传入规则函数来实现。
                 if (val.length > 50) {
                            return {
                                across: false,
                                text: "自定义规则不能大于50"
                            }
                        }
                        
                        return true
                
                }],
                labelText: "名称",
                actionType: "input",
            }
    
    }
}
```
------*自定义规则中冒号可以指定传参*

#### 监听事件推送

var svf = new SunVerifyForObject(targetObj, configObj);

在实例下即可注册监听事件使用方法$on

```
svf.$on('tirrger', function (errMsg) {
    // 返回示例
    // {
    //  errType: "empty",
    //  labelText: "人选",
    //  text: "人选添加的必须非空"
    // }
    
})
```
每当程序检测到 不符合的规则， 就会把错误信息从该函数中推送出来。


#### 触发验证

var svf = new SunVerifyForObject(targetObj, configObj);

在实例下调用test方法即可对触发验证

svf.test();


#### 开启页面require功能

SunVerifyForObject可以根据配置和页面产生联动， 在验证表单时， 可以做到动态提示（文字提示，边框变红）， 并自动滚动到元素。

config ---》swicthRequire

设置为true

如果开启页面require功能则必须配置两个class

config ---》requireOption

{
    mainClass: "sun_verify", // 指定表单元素的class
    requireClass: "sun_verify_require" // 指定require提示文字的class
}

配置示例示例：
```
    {
        config: {
                swicthRequire: true,
                requireOption: {
                        mainClass: "sun_verify" ,
                        requireClass: "sun_verify_require"
                }
        }， 
        rules： {
            name： {
                type： String,
                rules: ["empty"],
                labelText: "名称",
                actionType: "input"
            }
        }
    }
```

页面配置示例：

```
<div>
名称
       // 首先指定mainClass,也就是表单元素， 并绑定验证字段（data-verflykey）
    <input class="sun_verify" type="text" v-model="form.name" data-verflykey="name">  
    
     //  其次指定requireClass元素 ， 并绑定验证字段（data-requirekey）
    <div class="sun_verify_require" data-requirekey="name"></div>
</div>
```

##### 注意事项

1。如果targetObj（验证目标）是数组类型且开启了require功能， 那么需要在绑定DOM时通过设置data-vervaluetype="array" 来告诉程序 这个值应该按照数组来处理。
如果targetObj（验证目标）是对象类型则不用额外进行设置。

2。为了减少程序的复杂性， 简历如果是复杂表单， 建议进行拆分验证。






**本文档仅仅对 部分配置和功能做了说明。 如果有人感兴趣， 我会继续完善文档。** 

**更多配置请参考 示例程序**





