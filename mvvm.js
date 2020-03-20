class MVVM {
    constructor(options) {
        // 一上来，先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;

        // 如果有要编译的模板，则开始编译
        if (this.$el) {
            // 数据劫持 就是吧对象的所有属性 改成get和set方法
            new Observer(this.$data)
            this.proxyData(this.$data)
            // 用元素和数据进行编译
            new Compile(this.$el, this)
        }
    }
    // vm.$data代理到this上 ，可以直接this.属性来取值
    proxyData(data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key]
                },
                set(newValue) {
                    data[key] = newValue
                }
            })
        })
    }
}