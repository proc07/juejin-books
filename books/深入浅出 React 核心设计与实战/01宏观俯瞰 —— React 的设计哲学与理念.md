# 01宏观俯瞰 —— React 的设计哲学与理念

## 💡 React 的核心公式

$$UI = f(State)$$

React 的核心理念在于：**将用户界面声明式地表示为应用状态的纯函数映射**。

---

## ⚡ Fiber 架构与时间切片

在 React 16 之前，递归协调 Virtual DOM 树一旦启动便无法中断，若组件树过于庞大，将长时间阻塞浏览器主线程导致掉帧。
Fiber 架构将组件树改造成一个**双向链表结构**，实现了可中断的并发渲染！

```typescript
interface FiberNode {
  tag: WorkTag;
  key: null | string;
  type: any;
  stateNode: any;
  return: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  memoizedState: any;
  flags: Flags;
}
```
