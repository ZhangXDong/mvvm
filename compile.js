class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el :document.querySelector(el)
        this.vm = vm // vm是MVVM的实例（相当于Vue的实例）
        if (this.el) {
            // 如果这个元素能获取到，我们才开始编译（以防用户随便输入一个没有的节点）
            // 1.先把真是的DOM移入到内存中 fragment
            let fragment = this.node2fragment(this.el)
            
            // 2.编译模板 =》 提取想要的元素节点v-model等指令和文本节点{{}}
            // 如果是v-model，输入框把value赋值进去。如果是{{}}，属性进行替换
            this.compile(fragment)

            // 3.把编译号的fragment再塞回到页面里去
            this.el.appendChild(fragment)
        }
    }

    /* 核心的方法 */
    node2fragment(el) { // 需要将el中的内容全部放到内存
        // 文档碎片，内存中的DOM节点
        let fragment = document.createDocumentFragment()
        let firstChild
        while(firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment // 内存中的节点
    }
    // 元素节点编译
    compileElement(node) {
        // 编译元素 带v-model v-text指令
        let attrs = node.attributes // 取出当前节点的属性
        Array.from(attrs).forEach(attr => { // attr:  type="text" / v-model="message"
            // 判断属性名字是不是包含 v-
            let attrName = attr.name // type v-model
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点中
                let expr = attr.value // message（text没了，因为type属性没有v-，进不到这儿了）
                let [, type] = attrName.split('-') // model text html 等
                CompileUtil[type](node, this.vm, expr) // 调用编译工具函数里对应的方法
            }
        })
    }
    // 文本节点编译
    compileText(node) {
        // 编译文本 {{}} {{a}} {{b}} {{c}}
        let expr = node.textContent // 取文本中的内容 {{message}}
        let reg = /\{\{([^}]+)\}\}/g  
        if (reg.test(expr)) {
            CompileUtil['text'](node, this.vm, expr)
        }
    }
    // 节点编译
    compile(fragment) {
        // 需要递归：有可能节点套节点
        let childNodes = fragment.childNodes // 拿到第一级子节点
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {// 是元素节点
                // 是元素节点，还需要继续深入检查
                // 这里需要编译元素
                this.compileElement(node)
                this.compile(node)
            } else {
                // 文本节点
                // 这里需要编译文本
                this.compileText(node)

            }
        })
    }

    /* 专门写一些辅助的方法 */
    isElementNode(node) {
        return node.nodeType === 1
    }
    isDirective(name) { // 是不是指令
        return name.includes('v-')
    }
}

// 编译工具方法
CompileUtil = {
    // 获取实例上对应的值
    getVal(vm, expr) {
        let result
        expr = expr.split('.') // [a, b, c]
        expr.reduce((prev, next) => {// 兼容a.b.c这种数据格式
            result = prev[next]
        }, vm.$data)
        return result
    },
    // 获取编译文本后的结果
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            return this.getVal(vm, arguments[1]) // arguments[1]是 a.b.c
        })
    },
    setVal(vm, expr, value) {
        expr = expr.split('.')
        // 收敛
        return expr.reduce((prev, next, currentIndex) => {
            if (currentIndex === expr.length - 1) {
                return prev[next] = value
            }
            return prev[next]
        }, vm.$data)
    },
    // 编译- 文本处理
    text(node, vm, expr) { // expr 是{{message}}这种
        let updaterFn = this.updater['textUpdater']
        let value = this.getTextVal(vm, expr) // expr存在{{a.b.c.d}}这种结构，需要对这种情况进行取值

        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            new Watcher(vm, arguments[1], (newValue) => {
                // 如果数据变化了，文本节点需要重新获取依赖的数据，更新文本中的内容
                updaterFn && updaterFn(node, this.getTextVal(vm, expr))
            })
        })

        updaterFn && updaterFn(node, value)
    },
    // 编译- v-model输入框处理
    model(node, vm, expr) {  // expr 是{{message}}这种里面的message
        let updaterFn = this.updater['modelUpdater']

        // 这里应该加一个监控，数据变化了，应该调用这个watch的callback
        new Watcher(vm, expr, (newValue) => {
            // 当值变化后会调用cb,将新的值传递过来
            updaterFn && updaterFn(node, this.getVal(vm, expr))
        })
        node.addEventListener('input', (e) => {
            let newValue = e.target.value
            this.setVal(vm, expr, newValue)
        })
        let abc = this.getVal(vm, expr)
        updaterFn && updaterFn(node, this.getVal(vm, expr))
    },
    updater: {
        // 文本更新
        textUpdater(node, value) {
            node.textContent = value
        },
        // 输入框更新
        modelUpdater(node, value) {
            console.log(444, value);
            node.value = value
        }
    }
}