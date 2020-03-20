// 观察者
// 观察者的目的就是给需要变化的元素增加一个观察者，当数据变化的时候执行对应的方法
// 用新值和老值进行对比，如果发生变化，就调用更新方法
// vm.$watch(vm, 'a', function(params) {})

class Watcher {
    constructor(vm, expr, cb) { // 值发生变化就调cb
        this.vm = vm
        this.expr = expr // message
        this.cb = cb
        // 先获取一下老值
        this.value = this.get()

    }
    // 获取实例上对应的值
    getVal(vm, expr) {
        let result
        expr = expr.split('.')
        expr.reduce((prev, next) => {// 兼容a.b.c这种数据格式
            result = prev[next]
        }, vm.$data)
        return result
    }
    get() {
        // ★ compile里，new Watcher，执行constructor构造函数，会产生一个实例。将这个实例放到了 Dep的target属性上
        // ★ new Watcher之后，Dep.target就有值了（保存实例）
        Dep.target = this 
        // console.log(777, Dep.target);

        // ★ 这里取值，会调Observer的get方法
        // ★ 而Observer的get方法里，会把 Dep.target 放到 dep数组中（即把watcher实例放到数组中）
        let value = this.getVal(this.vm, this.expr) // 获取message的属性值，'hello world'

        // ★ Dep.target已经放到了 dep 数组中，Dep.target已经没用了
        // ★ 用完了以后，再释放掉
        Dep.target = null
        
        return value
    }
    // 对外暴露的方法，属性更新了，要执行update方法
    update() {
        // 获取新值
        let newValue = this.getVal(this.vm, this.expr)
        // 老值
        let oldValue = this.value

        if (newValue != oldValue) {
            this.cb(newValue) // 对应的watch的callback
        }
    }
}
