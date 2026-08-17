import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const BOOKS_DIR = path.join(ROOT_DIR, 'books');

const mysqlDir = path.join(BOOKS_DIR, 'MySQL 是怎样运行的：从根儿上理解 MySQL');
fs.mkdirSync(mysqlDir, { recursive: true });

const chapters = [
  {
    filename: '0万里长征第一步（非常重要） —— 如何愉快的阅读本小册.md',
    title: '0万里长征第一步（非常重要） —— 如何愉快的阅读本小册',
    content: `# 0万里长征第一步（非常重要） —— 如何愉快的阅读本小册

> 欢迎来到《MySQL 是怎样运行的：从根儿上理解 MySQL》！
> 在深入复杂的数据页与索引结构前，先花 3 分钟掌握本小册的学习地图与高效食用指南。

---

## 🎯 为什么写这本小册？

很多同学在学习 MySQL 时，往往一上来就背诵各种八股文：
- *“B+树和B树有什么区别？”*
- *“什么是覆盖索引与回表？”*
- *“MVCC 是怎么实现的？”*

但如果不了解**底层存储格式、页结构、Buffer Pool 的运行机制**，遇到复杂的线上慢查询或死锁问题时，依然会感到茫然无措。

本小册的目标：用**通俗易懂的语言 + 大量图解**，带你从最底层的二进制记录格式一路推导到复杂的查询优化器与事务锁机制！

\`\`\`sql
-- 开启你的 MySQL 探索之旅
SELECT 'Hello, InnoDB Storage Engine!' AS greeting;
\`\`\`

---

## 🗺️ 核心知识体系导图

\`\`\`
+---------------------------------------------------------+
|                  MySQL 架构与执行链路                     |
+---------------------------------------------------------+
       │
       ▼
+-----------------------+     +--------------------------+
|  底层存储与索引结构     | ──> |       查询优化器          |
| (Compact页/B+树/Buffer) |     | (成本计算/单表/连接/Explain)|
+-----------------------+     +--------------------------+
       │                                   │
       ▼                                   ▼
+---------------------------------------------------------+
|                    事务、Undo/Redo 与锁机制              |
+---------------------------------------------------------+
\`\`\`

---

## 💡 最佳阅读建议

1. **按顺序阅读**：前后的知识环环相扣，例如理解“单表访问方法”前需要先掌握“B+ 树索引”。
2. **动手实践**：小册中的所有 SQL 语句与 Explain 示例建议在本地 MySQL 5.7 / 8.0 环境中亲自执行验证。
3. **善用右侧大纲与笔记功能**：阅读器支持随堂高亮与记笔记，遇到重要结论建议标记保存。

> 准备好了吗？让我们正式进入 MySQL 的微观世界！
`
  },
  {
    filename: '1装作自己是个老手 —— 初识 MySQL.md',
    title: '1装作自己是个老手 —— 初识 MySQL',
    content: `# 1装作自己是个老手 —— 初识 MySQL

## 🖥️ 客户端与服务端的连接

MySQL 采用了经典的 **C/S (Client/Server) 架构**。每当我们使用终端运行 \`mysql -u root -p\` 时，本质上是启动了一个客户端进程与后台的 \`mysqld\` 守护进程建立网络连接。

\`\`\`bash
# 启动 MySQL 服务端
mysqld --default-storage-engine=InnoDB

# 客户端建立 TCP 连接
mysql -h 127.0.0.1 -P 3306 -u root -p
\`\`\`

---

## 🧩 MySQL Server 架构分层

MySQL Server 内部可以清晰地分为三层：

1. **连接层 (Connection Layer)**：负责客户端连接管理、认证授权与安全验证。
2. **服务层 (Server Layer)**：
   - **SQL 接口**：接收 SQL 命令。
   - **解析器 (Parser)**：词法分析与语法分析，生成语法树。
   - **优化器 (Optimizer)**：核心大脑！将 SQL 转换成代价最低的执行计划。
   - **查询缓存 (Query Cache)**：8.0 中已彻底移除。
3. **存储引擎层 (Storage Engine Layer)**：真正与磁盘打交道，负责数据的存储与提取（InnoDB、MyISAM、Memory 等）。

\`\`\`sql
-- 查看当前支持的所有存储引擎
SHOW ENGINES;
\`\`\`

| 存储引擎 | 事务支持 | 外键支持 | 锁粒度 | 默认聚簇索引 |
| :--- | :--- | :--- | :--- | :--- |
| **InnoDB** | ✅ 支持 | ✅ 支持 | 行级锁 + 表锁 | ✅ 必需 |
| **MyISAM** | ❌ 不支持 | ❌ 不支持 | 表级锁 | ❌ 非聚簇 |
| **Memory** | ❌ 不支持 | ❌ 不支持 | 表级锁 | ❌ 内存哈希 |
`
  },
  {
    filename: '4从一条记录说起 —— InnoDB 记录结构.md',
    title: '4从一条记录说起 —— InnoDB 记录结构',
    content: `# 4从一条记录说起 —— InnoDB 记录结构

平时我们在数据库中插入的一行行数据，在 InnoDB 底层到底长什么样？

---

## 📦 Compact 行格式剖析

以目前最常用的 \`Compact\` 行格式为例，一条完整的记录分为两大部分：**记录的额外信息** 和 **记录的真实数据**。

\`\`\`
+-----------------------------------------------------------------------------------------+
|                           Compact 行格式物理结构                                          |
+------------------------------------+----------------------------------------------------+
|             记录的额外信息           |                    记录的真实数据                    |
+-------------------+---------------+--------------------+---------+---------+------------+
| 变长字段长度列表   | NULL 值列表   | 记录头信息 (5字节)  | row_id  | trx_id  | roll_ptr   |
+-------------------+---------------+--------------------+---------+---------+------------+
\`\`\`

### 1. 变长字段长度列表 (Variable Length Field List)
对于 \`VARCHAR(M)\`、\`VARBINARY(M)\`、\`TEXT\` 等变长数据类型，InnoDB 必须在行头部记录这些字段占用的实际字节数。
- **逆序存放**：各变长字段的长度按照字段定义顺序的**逆序**存放。

### 2. NULL 值列表 (NULL Value Bitmap)
若表中某些列允许为 NULL，InnoDB 会用一个二进制位图来表示对应列是否为 NULL，从而节省存储空间。
- 若列值为 NULL，对应位为 \`1\`；否则为 \`0\`。
- 同样按字段顺序**逆序**存放，且以整字节向上取整对齐。

### 3. 三个隐藏列
每行记录中，InnoDB 会自动添加三个隐藏列：

| 列名 | 占用空间 | 是否必需 | 含义 |
| :--- | :--- | :--- | :--- |
| \`row_id\` | 6 字节 | 仅在无主键且无唯一非空索引时生成 | 全局递增的行标识 |
| \`trx_id\` | 6 字节 | 必需 | 产生本记录的事务 ID |
| \`roll_ptr\`| 7 字节 | 必需 | 回滚指针（指向 Undo Log）|
`
  },
  {
    filename: '6快速查询的秘籍 —— B+ 树索引.md',
    title: '6快速查询的秘籍 —— B+ 树索引',
    content: `# 6快速查询的秘籍 —— B+ 树索引

## 🌲 为什么是 B+ 树而不是二叉树或 B 树？

在磁盘 I/O 中，读取一个数据页通常需要花费数毫秒的时间。为了尽量减少磁盘 I/O 次数，索引结构必须做到**“矮胖”**（扇出极高，层级极低）。

\`\`\`
                       [ 根节点 Page 30 ]
                         /            \\
              [ 目录项 Page 20 ]       [ 目录项 Page 21 ]
                 /          \\             /          \\
         [ 数据页 Page 10 ] [ 数据页 11 ] [ 数据页 12 ] [ 数据页 13 ]
\`\`\`

### B+ 树的核心优势：
1. **非叶子节点只存储目录项（键值 + 指针）**：单个 16KB 数据页可以容纳更多的主键目录项，因此树高度通常仅为 2~4 层！
2. **叶子节点存储完整记录（聚簇索引）** 并通过双向链表相连：非常适合范围扫描（Range Scan）。
3. **查询效率极度稳定**：任何记录的检索都从根节点遍历至叶子节点。

---

## 🔍 聚簇索引 vs 二级索引 (二级回表)

\`\`\`sql
-- 假设存在表 user (id INT PRIMARY KEY, name VARCHAR(20), age INT, KEY idx_age(age));
SELECT * FROM user WHERE age = 25;
\`\`\`

1. **二级索引查找**：在 \`idx_age\` 树中找到 \`age = 25\` 的叶子节点，获取对应的主键 \`id\`。
2. **回表 (Bookmark Lookup)**：携带获取到的 \`id\` 再次到主键聚簇索引中检索整行完整数据。
`
  },
  {
    filename: '10条条大路通罗马 —— 单表访问方法.md',
    title: '10条条大路通罗马 —— 单表访问方法',
    content: `# 10条条大路通罗马 —— 单表访问方法

对于单张表的查询，MySQL 查询优化器会根据查询条件与索引分布，选择不同访问方法（Access Path）来执行。

---

## ⚡ 常见的单表访问方法

### 1. \`system\` / \`const\`
- **const**：根据主键（Primary Key）或唯一二级索引（Unique Key）与常数进行等值比较。
\`\`\`sql
SELECT * FROM single_table WHERE id = 1438;
\`\`\`

### 2. \`ref\`
- 当通过普通的二级索引（非唯一）与常数进行等值匹配时：
\`\`\`sql
SELECT * FROM single_table WHERE key1 = 'abc';
\`\`\`

### 3. \`ref_or_null\`
- 不仅查询二级索引等于常数，还包含 \`IS NULL\` 查询：
\`\`\`sql
SELECT * FROM single_table WHERE key1 = 'abc' OR key1 IS NULL;
\`\`\`

### 4. \`range\`
- 使用索引获取某个范围的记录（例如 \`BETWEEN\`、\`>\`、\`<\`、\`IN(...)\`）：
\`\`\`sql
SELECT * FROM single_table WHERE key2 BETWEEN 100 AND 500;
\`\`\`

### 5. \`index\`
- 扫描整个二级索引树，无需回表（覆盖索引）：
\`\`\`sql
SELECT key_part1, key_part2 FROM multi_key_table;
\`\`\`

### 6. \`ALL\` (全表扫描)
- 直接扫描整张聚簇索引叶子节点链表，代价通常最高。
`
  },
  {
    filename: '11两个表的亲密接触 —— 连接的原理.md',
    title: '11两个表的亲密接触 —— 连接的原理',
    content: `# 11两个表的亲密接触 —— 连接的原理

多表连接（JOIN）是业务开发中极其高频的操作。本章带你彻底搞懂连接算法的底层执行步骤！

---

## 🔄 嵌套循环连接 (Nested-Loop Join)

最基本的连接方式就像两层 \`for\` 循环：

\`\`\`python
# 伪代码演示 NLJ
for outer_row in驱动表 (t1):
    for inner_row in 被驱动表 (t2):
        if outer_row.match(inner_row):
            output(outer_row, inner_row)
\`\`\`

- **驱动表 (Driving Table)**：只访问一次。
- **被驱动表 (Driven Table)**：针对驱动表符合条件的每一行，都会访问一次被驱动表。

---

## 🚀 基于索引的连接 (Index Nested-Loop Join)

若被驱动表的连接字段建有索引，针对驱动表的每一条记录，被驱动表只需通过索引树以 \`ref\` 或 \`eq_ref\` 访问，大幅减少 I/O 代价！

## 📦 Block Nested-Loop Join (Join Buffer)

若被驱动表没有可用索引，MySQL 会分配一块 **Join Buffer** 内存，将驱动表的多条记录一批载入内存，然后扫描一次被驱动表同时与内存中所有驱动表记录进行匹配，将磁盘扫描次数减少几个数量级！
`
  },
  {
    filename: '12谁最便宜就选谁 —— MySQL 基于成本的优化.md',
    title: '12谁最便宜就选谁 —— MySQL 基于成本的优化',
    content: `# 12谁最便宜就选谁 —— MySQL 基于成本的优化

MySQL 查询优化器本质上是一个**基于成本的优化器 (Cost-Based Optimizer, CBO)**。

---

## 💰 什么是执行成本？

MySQL 评估一条 SQL 的执行代价主要包括两个维度：

1. **I/O 成本**：将数据从磁盘读取到内存的代价（默认读取一个 16KB 页面的成本常数为 \`1.0\`）。
2. **CPU 成本**：读取和检测记录是否满足搜索条件、排序等代价（默认检测一条记录的成本常数为 \`0.2\`）。

\`\`\`
总成本 = I/O 成本 + CPU 成本
\`\`\`

---

## 📊 成本计算实战过程

假设查询：
\`\`\`sql
SELECT * FROM single_table WHERE key1 BETWEEN 'a' AND 'z' AND common_field = 'test';
\`\`\`

优化器会分别计算：
1. **全表扫描的成本**：
   - I/O 代价：\`页面数 * 1.0 + 1.1\`
   - CPU 代价：\`总记录数 * 0.2 + 1.0\`
2. **使用 \`idx_key1\` 范围扫描 + 回表的成本**：
   - 范围区间扫描 I/O 代价
   - 回表聚簇索引 I/O 与 CPU 代价
3. **比对二者**：选择成本总和最低的方案作为最终执行计划！
`
  },
  {
    filename: '13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的.md',
    title: '13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的',
    content: `# 13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的

为了计算出准确的成本，优化器必须预先知道：表里大概有多少行数据？某个索引列的不同值基数（Cardinality）是多少？

---

## 📈 统计数据的存储方式

MySQL 支持两种统计数据持久化方式：
- **永久性统计数据 (innodb_stats_persistent = ON)**：保存在系统表 \`mysql.innodb_table_stats\` 和 \`mysql.innodb_index_stats\` 中。
- **非永久性统计数据 (Memory)**：服务器重启后重新采样计算。

\`\`\`sql
-- 查看表的统计数据
SELECT * FROM mysql.innodb_table_stats WHERE table_name = 'single_table';
\`\`\`

---

## 🎲 采样机制 (Sampling)

InnoDB 并不会遍历整张表来统计行数和区分度（这样对大表太慢），而是通过**随机采样叶子页面**并以此推算出整张表的统计指标。
`
  },
  {
    filename: '14不好看就要多整容 —— MySQL 基于规则的优化（内含关于子查询优化二三事儿）.md',
    title: '14不好看就要多整容 —— MySQL 基于规则的优化（内含关于子查询优化二三事儿）',
    content: `# 14不好看就要多整容 —— MySQL 基于规则的优化

在计算具体执行成本之前，优化器会对我们写出的 SQL 语句进行等价变换与重构（整容），消除不必要的冗余子句。

---

## ✨ 常见重构规则

1. **子查询展开与半连接 (Semi-Join)**：将 \`IN (SELECT ...)\` 子查询转化为多表连接。
2. **物化 (Materialization)**：将不相关的独立子查询执行一次并将结果暂存到临时表（建立哈希索引）。
3. **常量传递与死代码消除**：
   - \`WHERE a = 5 AND b = a\` 转换为 \`WHERE a = 5 AND b = 5\`。
   - \`WHERE 1 = 0\` 直接判定为恒假，直接返回空集。
`
  },
  {
    filename: '15查询优化的百科全书 —— Explain 详解（上）.md',
    title: '15查询优化的百科全书 —— Explain 详解（上）',
    content: `# 15查询优化的百科全书 —— Explain 详解（上）

\`EXPLAIN\` 语句是每位后端工程师分析和调优 SQL 的必备瑞士军刀！

---

## 📋 Explain 输出字段全景

\`\`\`sql
EXPLAIN SELECT * FROM single_table WHERE key1 = 'abc' AND common_field = 'xyz';
\`\`\`

| id | select_type | table | partitions | type | possible_keys | key | key_len | ref | rows | filtered | Extra |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | SIMPLE | single_table | NULL | ref | idx_key1 | idx_key1 | 303 | const | 1 | 100.00 | Using index condition |

---

## 🔑 重点列深度解析 (上)

### 1. \`id\`
- 每个 \`SELECT\` 关键字对应一个唯一的 \`id\`。
- \`id\` 相同的行代表连接查询的一组表；\`id\` 越大的行优先级越高越先执行。

### 2. \`select_type\`
- **SIMPLE**：不包含 \`UNION\` 或子查询的简单查询。
- **PRIMARY**：最外层的主查询。
- **SUBQUERY**：不相关子查询。
- **DERIVED**：派生表（FROM 子句中的子查询）。
`
  },
  {
    filename: '16查询优化的百科全书 —— Explain 详解（下）.md',
    title: '16查询优化的百科全书 —— Explain 详解（下）',
    content: `# 16查询优化的百科全书 —— Explain 详解（下）

承接上篇，本章重点攻克 \`type\`、\`rows\` 以及最为关键的 \`Extra\` 列！

---

## 🚀 \`type\` 访问类型排行榜 (由好到差)

\`\`\`
system > const > eq_ref > ref > range > index > ALL
\`\`\`

- **eq_ref**：在连接查询中，被驱动表通过主键或唯一二级索引进行等值匹配。
- **range**：利用索引进行范围查找。
- **index**：全索引扫描，通常发生在查询的所有列均在某个二级索引覆盖范围内。
- **ALL**：全表扫描，需要重点优化！

---

## 🏷️ \`Extra\` 列高频重点提示

- **Using index**：🎉 最佳状态！使用了**覆盖索引**，不需要回表查询聚簇索引。
- **Using where**：存储引擎检索记录后，Server 层使用 \`WHERE\` 条件进一步过滤。
- **Using index condition (ICP)**：**索引条件下推**！在二级索引遍历时即可提前过滤部分条件，极大减少回表次数。
- **Using filesort**：无法利用索引完成排序，需要占用内存（甚至临时文件）进行额外排序。
- **Using temporary**：需要创建内部临时表处理查询（如 \`DISTINCT\` 或不带索引的 \`GROUP BY\`）。
`
  }
];

for (const c of chapters) {
  const filePath = path.join(mysqlDir, c.filename);
  fs.writeFileSync(filePath, c.content, 'utf-8');
}

// Also create sample PDF files (simple placeholder PDF headers or sample PDF bytes)
for (const c of chapters) {
  const pdfName = c.filename.replace('.md', '.pdf');
  const pdfPath = path.join(mysqlDir, pdfName);
  // Minimal valid PDF binary
  const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 64 >> stream
BT /F1 20 Tf 50 700 Td (${c.title}) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000222 00000 n 
0000000299 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
414
%%EOF`;
  fs.writeFileSync(pdfPath, minimalPdf, 'utf-8');
}

// Also create a second booklet for rich experience
const reactDir = path.join(BOOKS_DIR, '深入浅出 React 核心设计与实战');
fs.mkdirSync(reactDir, { recursive: true });

const reactChapters = [
  {
    filename: '01宏观俯瞰 —— React 的设计哲学与理念.md',
    title: '01宏观俯瞰 —— React 的设计哲学与理念',
    content: `# 01宏观俯瞰 —— React 的设计哲学与理念

## 💡 React 的核心公式

$$UI = f(State)$$

React 的核心理念在于：**将用户界面声明式地表示为应用状态的纯函数映射**。

---

## ⚡ Fiber 架构与时间切片

在 React 16 之前，递归协调 Virtual DOM 树一旦启动便无法中断，若组件树过于庞大，将长时间阻塞浏览器主线程导致掉帧。
Fiber 架构将组件树改造成一个**双向链表结构**，实现了可中断的并发渲染！

\`\`\`typescript
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
\`\`\`
`
  },
  {
    filename: '02深度剖析 —— React Hooks 的运行机制.md',
    title: '02深度剖析 —— React Hooks 的运行机制',
    content: `# 02深度剖析 —— React Hooks 的运行机制

Hooks 本质上是保存在 Fiber 节点的 \`memoizedState\` 单向链表上的。

\`\`\`typescript
import React, { useState, useEffect } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`点击了 \${count} 次\`;
  }, [count]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`
`
  }
];

for (const c of reactChapters) {
  fs.writeFileSync(path.join(reactDir, c.filename), c.content, 'utf-8');
}

console.log('Sample booklets successfully generated in books/!');
