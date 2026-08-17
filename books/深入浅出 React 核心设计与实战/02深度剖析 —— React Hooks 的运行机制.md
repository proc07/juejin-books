# 02深度剖析 —— React Hooks 的运行机制

Hooks 本质上是保存在 Fiber 节点的 `memoizedState` 单向链表上的。

```typescript
import React, { useState, useEffect } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `点击了 ${count} 次`;
  }, [count]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```
