import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const mysqlDir = path.join(ROOT_DIR, 'books', 'MySQL 是怎样运行的：从根儿上理解 MySQL');

if (!fs.existsSync(mysqlDir)) {
  fs.mkdirSync(mysqlDir, { recursive: true });
}

// Clean up old mismatching filenames
const oldFiles = [
  '1装作自己是个老手 —— 初识 MySQL.md',
  '1装作自己是个老手 —— 初识 MySQL.pdf',
  '4从一条记录说起 —— InnoDB 记录结构.md',
  '4从一条记录说起 —— InnoDB 记录结构.pdf',
];
for (const f of oldFiles) {
  const p = path.join(mysqlDir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const chapters = [
  {
    filename: '0万里长征第一步（非常重要） —— 如何愉快的阅读本小册.md',
    title: '0万里长征第一步（非常重要） —— 如何愉快的阅读本小册',
    content: `# 0万里长征第一步（非常重要） —— 如何愉快的阅读本小册

> 欢迎来到《MySQL 是怎样运行的：从根儿上理解 MySQL》！在深入底层的数据页与索引结构前，先花 3 分钟掌握本小册的学习地图与高效食用指南。

## 🎯 为什么写这本小册？

很多同学在学习 MySQL 时，往往一上来就背诵各种八股文：
- *“B+树和B树有什么区别？”*
- *“什么是覆盖索引与回表？”*
- *“MVCC 是怎么实现的？”*

但如果不了解**底层存储格式、页结构、Buffer Pool 的运行机制**，遇到复杂的线上慢查询或死锁问题时，依然会感到茫然无措。

本小册的目标：**用通俗易懂的语言 + 大量图解**，带你从最底层的二进制记录格式一路推导到复杂的查询优化器与事务锁机制！

## 🗺️ 全书知识图谱与结构总览

1. **第一部分：准备工作（第 1~3 章）**：重新认识 MySQL 客户端/服务端架构、字符集与系统变量。
2. **第二部分：存储篇（第 4~9 章）**：从 Compact 行格式、页结构、B+ 树索引到表空间与区/段管理。
3. **第三部分：执行篇（第 10~14 章）**：单表访问方法、连接查询原理、基于成本与规则的查询优化。
4. **第四部分：工具篇（第 15~17 章）**：Explain 详解与 Optimizer Trace 神器使用。
5. **第五部分：内核篇（第 18 章）**：InnoDB Buffer Pool 缓冲池机制。
6. **第六部分：事务与锁（第 19~23 章）**：ACID 原理、Redo/Undo 日志、MVCC 与行级锁。

---

*让我们正式开始探索 MySQL 的神秘内部世界吧！*
`
  },
  {
    filename: '1装作自己是个小白 —— 重新认识MySQL.md',
    title: '1装作自己是个小白 —— 重新认识MySQL',
    content: `# 1装作自己是个小白 —— 重新认识MySQL

## 🖥️ 客户端与服务器架构

MySQL 采用典型的 **C/S（Client/Server）** 架构模式。我们在日常开发中使用的 Navicat、DataGrip、命令行 \`mysql\` 工具都是客户端，而真正存储数据、处理查询的是 \`mysqld\` 服务端守护进程。

\`\`\`sql
-- 连接到 MySQL 服务器
mysql -h 127.0.0.1 -u root -P 3306 -p
\`\`\`

## 🔄 请求处理的三层大架构

当客户端向服务端发送一条 SQL 语句时，服务端内部经历了哪些处理？

1. **连接管理（Connection Pool）**：
   - 负责客户端的认证、握手与权限校验。
   - 为每个客户端连接分配独立的线程（或基于线程池复用）。
2. **解析与优化（Server 层）**：
   - **查询缓存 (Query Cache)**（MySQL 8.0 已移除）：直接命中静态缓存。
   - **语法词法解析器 (Parser)**：构建 AST 抽象语法树。
   - **查询优化器 (Optimizer)**：决定索引选择、连接顺序与最佳执行计划。
3. **存储引擎（Storage Engine 层）**：
   - 负责数据的实际物理存储与提取（InnoDB、MyISAM、Memory 等）。
   - **InnoDB** 是 MySQL 5.5+ 默认的事务型存储引擎。
`
  },
  {
    filename: '2MySQL的调控按钮 —— 启动选项和系统变量.md',
    title: '2MySQL的调控按钮 —— 启动选项和系统变量',
    content: `# 2MySQL的调控按钮 —— 启动选项和系统变量

## ⚙️ 启动选项 (Startup Options)

在启动 MySQL 服务器时，我们可以通过命令行参数或配置文件指定启动选项：

\`\`\`bash
# 命令行方式启动
mysqld --default-storage-engine=InnoDB --max-connections=200
\`\`\`

## 📄 配置文件 (my.cnf / my.ini)

MySQL 会按照特定优先级依次扫描以下路径的配置文件：
- \`/etc/my.cnf\`
- \`/etc/mysql/my.cnf\`
- \`~/.my.cnf\`

\`\`\`ini
[mysqld]
default-storage-engine = InnoDB
innodb_buffer_pool_size = 1G
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
\`\`\`

## 🔍 系统变量 (System Variables)

\`\`\`sql
-- 查看全局系统变量
SHOW GLOBAL VARIABLES LIKE 'innodb_buffer_pool_size';

-- 查看会话系统变量
SHOW SESSION VARIABLES LIKE 'autocommit';

-- 动态修改全局变量
SET GLOBAL max_connections = 500;
\`\`\`
`
  },
  {
    filename: '3乱码的前世今生 —— 字符集和比较规则.md',
    title: '3乱码的前世今生 —— 字符集和比较规则',
    content: `# 3乱码的前世今生 —— 字符集和比较规则

## 🔤 字符集 (Character Set) 与比较规则 (Collation)

- **字符集**：字符在计算机底层的二进制编码映射（如 ASCII、GBK、UTF-8）。
- **比较规则**：字符之间如何比较大小和排序（例如是否区分大小写 \`_ci\` vs \`_bin\`）。

\`\`\`sql
-- 查看 MySQL 支持的字符集
SHOW CHARSET;

-- 查看比较规则
SHOW COLLATION WHERE Charset = 'utf8mb4';
\`\`\`

## ⚠️ utf8 与 utf8mb4 的重大区别

> **划重点**：MySQL 中的 \`utf8\`（即 \`utf8mb3\`）是阉割版 UTF-8，最多只支持 3 个字节！无法存储 Emoji 表情（如 😊）和部分生僻字。
>
> 💡 **生产环境强制要求使用 \`utf8mb4\`！**
`
  },
  {
    filename: '4从一条记录说起—— InnoDB 记录结构.md',
    title: '4从一条记录说起—— InnoDB 记录结构',
    content: `# 4从一条记录说起—— InnoDB 记录结构

## 📦 Compact 行格式剖析

InnoDB 将每条插入的数据行存储为特定的二进制结构。最常用的行格式是 **Compact** 和 **Dynamic**。

一条 Compact 记录由**额外信息**和**真实数据**两部分组成：

1. **变长字段长度列表 (Variable Length Field List)**：
   - 逆序存放所有 \`VARCHAR\`、\`TEXT\` 等变长字段的实际字节长度。
2. **NULL 值列表 (NULL Value Bitmap)**：
   - 用二进制位图标记哪些允许为 NULL 的列当前确实是 NULL，省去存储空间。
3. **记录头信息 (Record Header)**：
   - 占用 5 字节（40 位），记录 \`deleted_flag\`、\`min_rec_flag\`、\`n_owned\`、\`heap_no\`、\`record_type\` 以及指向下一条记录的偏移量 \`next_record\`。
4. **真实数据与隐藏列**：
   - \`DB_ROW_ID\`（6 字节，未显式指定主键且无唯一索引时生成）
   - \`DB_TRX_ID\`（6 字节，最近修改本记录的事务 ID）
   - \`DB_ROLL_PTR\`（7 字节，回滚段指针，指向 Undo Log）
   - 用户自定义列真实数据。
`
  },
  {
    filename: '5盛放记录的大盒子 —— InnoDB 数据页结构.md',
    title: '5盛放记录的大盒子 —— InnoDB 数据页结构',
    content: `# 5盛放记录的大盒子 —— InnoDB 数据页结构

## 📄 什么是页 (Page)？

InnoDB 与磁盘交互的最小基本单位是**页（Page）**，默认大小为 **16 KB**。

\`\`\`sql
SHOW GLOBAL VARIABLES LIKE 'innodb_page_size'; -- 16384 Bytes
\`\`\`

## 📐 数据页的 7 大核心组成部分

1. **File Header (38B)**：记录页号、上一页指针、下一页指针（双向链表）、校验和 Checksum。
2. **Page Header (56B)**：记录本页中的槽数量、第一条记录位置、垃圾链表头等统计状态。
3. **Infimum + Supremum Records (26B)**：本页虚拟的最小记录与最大记录边界。
4. **User Records**：真正存储我们插入的一条条用户数据记录（单向链表串联）。
5. **Free Space**：当前页尚未使用的空白碎片空间。
6. **Page Directory (页目录)**：将用户记录分组，每个组的组长偏移量存放在槽（Slot）中，用于在页内利用**二分法**毫秒级定位目标记录！
7. **File Trailer (8B)**：校验和尾部，防止页写入一半发生断电（Partial Write）。
`
  },
  {
    filename: '6快速查询的秘籍 —— B+ 树索引.md',
    title: '6快速查询的秘籍 —— B+ 树索引',
    content: `# 6快速查询的秘籍 —— B+ 树索引

## 🌲 为什么是 B+ 树？

1. **叶子节点双向链表**：非常适合范围扫描（Range Scan）与分页。
2. **极高的扇出（Fan-out）**：普通 3 层 B+ 树即可容纳两千万条行记录，磁盘 IO 仅需 2~3 次！
3. **聚簇索引 vs 二级索引**：
   - **聚簇索引（Clustered Index）**：叶子节点存放完整的整行数据（Primary Key）。
   - **二级索引（Secondary Index）**：叶子节点存放索引列值 + 对应的主键值（查询其他列需进行“回表”）。
`
  },
  {
    filename: '7好东西也得先学会怎么用 —— B+ 树索引的使用.md',
    title: '7好东西也得先学会怎么用 —— B+ 树索引的使用',
    content: `# 7好东西也得先学会怎么用 —— B+ 树索引的使用

## 🔑 索引高效使用的金科玉律

1. **最左前缀原则 (Leftmost Prefix Match)**：
   联合索引 \`(a, b, c)\` 只能按顺序从左往右匹配。
2. **覆盖索引 (Covering Index)**：
   查询的所有列都在二级索引树上，无需回表，性能提升数倍！
3. **避免索引失效的场景**：
   - 索引列上进行函数计算或表达式计算：\`WHERE SUBSTR(name, 1, 3) = 'abc'\`
   - 隐式类型转换（如数字与字符串未加单引号匹配）
   - \`LIKE '%abc'\` 左模糊查询
   - 错误的 OR 条件连接
`
  },
  {
    filename: '8数据的家 —— MySQL 的数据目录.md',
    title: '8数据的家 —— MySQL 的数据目录',
    content: `# 8数据的家 —— MySQL 的数据目录

## 📂 数据目录结构剖析

\`\`\`sql
SHOW VARIABLES LIKE 'datadir';
-- 例如 /usr/local/mysql/data/ 或 /var/lib/mysql/
\`\`\`

- \`ibdata1\`：系统表空间（System Tablespace）
- \`undo_001\`, \`undo_002\`：Undo 表空间
- \`*.ibd\`：独立表空间文件（包含表的数据与索引）
- \`ib_logfile0\`, \`ib_logfile1\`：Redo Log 重做日志文件
`
  },
  {
    filename: '9存放页面的大池子 —— InnoDB 的表空间.md',
    title: '9存放页面的大池子 —— InnoDB 的表空间',
    content: `# 9存放页面的大池子 —— InnoDB 的表空间

## 🌊 区 (Extent) 与段 (Segment)

- **页 (Page)**：16 KB
- **区 (Extent)**：连续的 64 个页，大小固定为 **1 MB**。顺序分配区能够极大减少磁盘随机 IO。
- **段 (Segment)**：逻辑概念，分为叶子节点段（数据段）、非叶子节点段（索引段）和回滚段。
- **表空间 (Tablespace)**：由多个段构成的庞大逻辑容器。
`
  },
  {
    filename: '10条条大路通罗马 —— 单表访问方法.md',
    title: '10条条大路通罗马 —— 单表访问方法',
    content: `# 10条条大路通罗马 —— 单表访问方法

## ⚡ 常见的单表访问类型 (Access Paths)

1. **const**：主键或唯一二级索引等值匹配（常数级别，1 次 IO）。
2. **ref**：普通非唯一二级索引等值匹配。
3. **ref_or_null**：普通二级索引等值或 \`IS NULL\` 匹配。
4. **range**：索引范围查询（\`BETWEEN\`、\`IN\`、\`>\`、\`<\`）。
5. **index**：全索引扫描（无需回表的覆盖索引全扫描）。
6. **ALL**：全表扫描（最慢）。
`
  },
  {
    filename: '11两个表的亲密接触 —— 连接的原理.md',
    title: '11两个表的亲密接触 —— 连接的原理',
    content: `# 11两个表的亲密接触 —— 连接的原理

## 🔄 连接算法演进

1. **Simple Nested-Loop Join (简单嵌套循环连接)**：
   外表 $M$ 条，内表 $N$ 条，需要扫描 $M \times N$ 次。
2. **Index Nested-Loop Join (基于索引的嵌套循环连接)**：
   内表连接条件有索引，利用 B+ 树快速查找被驱动表记录。
3. **Block Nested-Loop Join (基于 Join Buffer 的块嵌套循环连接)**：
   将外表多条数据一次性加载到 Join Buffer 内存中，批量匹配内表，大幅减少内表物理磁盘读取次数。
`
  },
  {
    filename: '12谁最便宜就选谁 —— MySQL 基于成本的优化.md',
    title: '12谁最便宜就选谁 —— MySQL 基于成本的优化',
    content: `# 12谁最便宜就选谁 —— MySQL 基于成本的优化

## 💰 什么是执行成本？

MySQL 查询优化器通过计算两种成本并加权求和：
$$\\text{总成本} = \\text{I/O 成本} + \\text{CPU 成本}$$

- **I/O 成本**：将页面从磁盘读取到内存的开销（规定读取 1 个页默认成本为 \`1.0\`）。
- **CPU 成本**：读取并校验记录是否符合条件的开销（规定校验 1 条记录默认成本为 \`0.2\`）。

优化器会计算全表扫描成本和各个候选索引的成本，**选择总代价最小的方案**作为最终执行计划！
`
  },
  {
    filename: '13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的.md',
    title: '13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的',
    content: `# 13兵马未动，粮草先行 —— InnoDB 统计数据是如何收集的

## 📊 统计数据与采样机制

优化器在计算成本时，需要知道表中大约有多少记录、每个索引的基数（Cardinality）是多少。

- **动态采样**：通过采样少量叶子节点页估算全表数据分布。
- **永久性统计表**：\`mysql.innodb_table_stats\` 和 \`mysql.innodb_index_stats\`。
`
  },
  {
    filename: '14不好看就要多整容 —— MySQL 基于规则的优化（内含关于子查询优化二三事儿）.md',
    title: '14不好看就要多整容 —— MySQL 基于规则的优化（内含关于子查询优化二三事儿）',
    content: `# 14不好看就要多整容 —— MySQL 基于规则的优化

## 🛠️ 查询重写与子查询展开 (Subquery Optimization)

1. **常量传递**：\`WHERE a = 5 AND b > a\` $\\rightarrow$ \`WHERE a = 5 AND b > 5\`
2. **等式消除**：简化多余判断条件。
3. **Semi-Join 半连接展开**：将 \`IN (SELECT ...)\` 子查询改写为半连接，避免相关子查询逐行重复执行。
`
  },
  {
    filename: '15查询优化的百科全书 —— Explain 详解（上）.md',
    title: '15查询优化的百科全书 —— Explain 详解（上）',
    content: `# 15查询优化的百科全书 —— Explain 详解（上）

## 📋 Explain 关键列深度解读

\`\`\`sql
EXPLAIN SELECT * FROM users WHERE status = 1;
\`\`\`

- **id**：执行顺序编号（id 越大越先执行，相同 id 从上往下执行）。
- **select_type**：SIMPLE（简单查询）、PRIMARY（主查询）、SUBQUERY（子查询）、DERIVED（派生表）。
- **table**：正在访问的表名或别名。
- **partitions**：命中的分区。
`
  },
  {
    filename: '16查询优化的百科全书 —— Explain 详解（下）.md',
    title: '16查询优化的百科全书 —— Explain 详解（下）',
    content: `# 16查询优化的百科全书 —— Explain 详解（下）

## 🔍 type 与 Extra 核心指标

- **type 优劣排序**：
  \`system\` > \`const\` > \`eq_ref\` > \`ref\` > \`range\` > \`index\` > \`ALL\`
- **Extra 关键信号**：
  - \`Using index\`：✅ 完美！使用了覆盖索引，无回表。
  - \`Using index condition\`：使用了索引下推（ICP）。
  - \`Using filesort\`：⚠️ 警告！无法利用索引排序，需要内存/磁盘文件排序。
  - \`Using temporary\`：⚠️ 警告！使用了临时表（常见于 \`GROUP BY\` 或 \`DISTINCT\`）。
`
  },
  {
    filename: '17神兵利器 —— optimizer trace 的神器功效.md',
    title: '17神兵利器 —— optimizer trace 的神器功效',
    content: `# 17神兵利器 —— optimizer trace 的神器功效

## 🔬 揭秘优化器的黑盒决策过程

当你想知道为什么 MySQL 没走某个索引而是走全表扫描时，可以使用 Optimizer Trace：

\`\`\`sql
-- 开启 trace
SET optimizer_trace="enabled=on";

-- 执行目标查询
SELECT * FROM orders WHERE user_id = 100 AND status = 'PAID';

-- 查看详细的决策日志
SELECT * FROM information_schema.OPTIMIZER_TRACE;
\`\`\`
`
  },
  {
    filename: '18调节磁盘和CPU的矛盾 —— InnoDB 的 Buffer Pool.md',
    title: '18调节磁盘和CPU的矛盾 —— InnoDB 的 Buffer Pool',
    content: `# 18调节磁盘和CPU的矛盾 —— InnoDB 的 Buffer Pool

## 💾 缓冲池架构

InnoDB 在内存中开辟了一片大内存池：**Buffer Pool**。

1. **Free 链表**：记录哪些控制块对应的缓冲页是空闲的。
2. **Flush 链表**：记录被修改过的脏页（Dirty Pages），由后台线程刷盘。
3. **LRU 链表（冷热分离分区）**：
   - Young 区（热区，前 5/8）
   - Old 区（冷区，后 3/8）
   - **1000ms 时间窗口机制**：防止全表扫描冲刷掉所有热点缓存！
`
  },
  {
    filename: '19从猫爷被杀说起 —— 事务简介.md',
    title: '19从猫爷被杀说起 —— 事务简介',
    content: `# 19从猫爷被杀说起 —— 事务简介

## 🛡️ ACID 特性总览

1. **Atomicity (原子性)**：事务中所有操作要么全成功，要么全失败（由 **Undo Log** 保障）。
2. **Consistency (一致性)**：数据状态由一个有效状态转换到另一个有效状态。
3. **Isolation (隔离性)**：并发事务互不干扰（由 **锁 + MVCC** 保障）。
4. **Durability (持久性)**：一旦提交，更改永久生效（由 **Redo Log** 保障）。
`
  },
  {
    filename: '20说过的话就一定要办到 —— redo 日志（上）.md',
    title: '20说过的话就一定要办到 —— redo 日志（上）',
    content: `# 20说过的话就一定要办到 —— redo 日志（上）

## 📝 为什么需要 Redo Log？

WAL（Write-Ahead Logging）机制：先写日志，再写磁盘！
- 顺序写日志开销极小。
- 保证系统崩溃（Crash）时能进行数据恢复（Crash Recovery）。
`
  },
  {
    filename: '21说过的话就一定要办到 —— redo 日志（下）.md',
    title: '21说过的话就一定要办到 —— redo 日志（下）',
    content: `# 21说过的话就一定要办到 —— redo 日志（下）

## 🔄 Checkpoint 与 LSN (Log Sequence Number)

- **LSN**：单调递增的全局日志序列号。
- **Checkpoint**：标记已经安全刷入磁盘的脏页位置。
- 当数据库崩溃重启时，只需从 Checkpoint 对应的 LSN 往后重放 Redo 日志即可！
`
  },
  {
    filename: '22后悔了怎么办 —— undo 日志.md',
    title: '22后悔了怎么办 —— undo 日志',
    content: `# 22后悔了怎么办 —— undo 日志

## ⏪ 回滚与多版本控制

- 当执行 \`ROLLBACK\` 或事务异常时，根据 Undo Log 执行逆向操作（如 INSERT 对应 DELETE，UPDATE 对应改回旧值）。
- Undo Log 中的历史版本串联成**版本链**，供 MVCC 快照读使用。
`
  },
  {
    filename: '23工作面试老大难 —— 锁.md',
    title: '23工作面试老大难 —— 锁',
    content: `# 23工作面试老大难 —— 锁

## 🔒 行锁类型与死锁分析

1. **Record Lock (记录锁)**：只锁定单条记录。
2. **Gap Lock (间隙锁)**：锁定两个记录之间的开区间，防止幻读。
3. **Next-Key Lock (临键锁)**：Record Lock + Gap Lock（左开右闭）。
4. **意向锁 (Intention Lock)**：表级别的意向共享锁 (IS) 与意向独占锁 (IX)。
`
  },
  {
    filename: '24写作本书时用到的一些重要的参考资料.md',
    title: '24写作本书时用到的一些重要的参考资料',
    content: `# 24写作本书时用到的一些重要的参考资料

## 📚 推荐进阶书目与官方文档

1. 《MySQL 技术内幕：InnoDB 存储引擎》（姜承尧 著）
2. 《高性能 MySQL》（High Performance MySQL）
3. MySQL 8.0 Reference Manual - The InnoDB Storage Engine
4. Jeremy Cole 的 InnoDB Diagrams 系列开源图解
`
  }
];

// Write all 25 chapters
for (const ch of chapters) {
  const mdPath = path.join(mysqlDir, ch.filename);
  fs.writeFileSync(mdPath, ch.content, 'utf-8');
  console.log('✓ Wrote chapter:', ch.filename);
}

console.log('Successfully completed all 25 chapters!');
