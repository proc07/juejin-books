# 15查询优化的百科全书 —— Explain 详解（上）

`EXPLAIN` 语句是每位后端工程师分析和调优 SQL 的必备瑞士军刀！

---

## 📋 Explain 输出字段全景

```sql
EXPLAIN SELECT * FROM single_table WHERE key1 = 'abc' AND common_field = 'xyz';
```

| id | select_type | table | partitions | type | possible_keys | key | key_len | ref | rows | filtered | Extra |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | SIMPLE | single_table | NULL | ref | idx_key1 | idx_key1 | 303 | const | 1 | 100.00 | Using index condition |

---

## 🔑 重点列深度解析 (上)

### 1. `id`
- 每个 `SELECT` 关键字对应一个唯一的 `id`。
- `id` 相同的行代表连接查询的一组表；`id` 越大的行优先级越高越先执行。

### 2. `select_type`
- **SIMPLE**：不包含 `UNION` 或子查询的简单查询。
- **PRIMARY**：最外层的主查询。
- **SUBQUERY**：不相关子查询。
- **DERIVED**：派生表（FROM 子句中的子查询）。
