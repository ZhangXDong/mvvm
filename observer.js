class Observer {
    constructor(data) {
        this.observe(data)
    }
    // 专门用于数据劫持
    observe(data) {
        // 要对data数据原有的属性改成get和set的形式
        if (!data || typeof data !== 'object') {
            return;
        }  
        // 要将数据一一劫持，先获取到data的key和value
        Object.keys(data).forEach(key => {
            // 劫持
            this.defineReactive(data, key, data[key])
            this.observe(data[key]) // 深度递归劫持
        })

    }
    // 定义响应式
    defineReactive(obj, key, value) {
        // 用Object.defineProperty，可以在取值、设置值的时候干些其他的事。
        // 这是直接赋值做不到的
        let that = this
        let dep = new Dep() // ★每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
        Object.defineProperty(obj, key, {
            enumerable: true, // 可枚举
            configurable: true, // 可配置（想删除一个属性可以删除）
            get() {
                Dep.target && dep.addSub(Dep.target) // ★收集依赖。
                return value
            },
            set(newValue) {
                if (newValue != value) {
                    // 这里的this不是实例
                    that.observe(newValue) // 如果设置的新值是对象，则继续劫持

                    value = newValue

                    dep.notify() // ★通知所有人，数据更新了
                }
            }
        })
    }
}

// 发布订阅  
// 先把watcher维护到数组，一旦数据变动，依次执行数组里面的每个watcher的更新函数
class Dep {
    constructor() {
        // 订阅的数组
        this.subs = []
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        this.subs.forEach(watcher => {
            watcher.update()
        })
    }
}