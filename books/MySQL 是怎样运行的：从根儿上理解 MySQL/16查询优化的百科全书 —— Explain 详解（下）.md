# 16查询优化的百科全书 —— Explain 详解（下）

承接上篇，本章重点攻克 `type`、`rows` 以及最为关键的 `Extra` 列！

---

## 🚀 `type` 访问类型排行榜 (由好到差)

```
system > const > eq_ref > ref > range > index > ALL
```

- **eq_ref**：在连接查询中，被驱动表通过主键或唯一二级索引进行等值匹配。
- **range**：利用索引进行范围查找。
- **index**：全索引扫描，通常发生在查询的所有列均在某个二级索引覆盖范围内。
- **ALL**：全表扫描，需要重点优化！

---

## 🏷️ `Extra` 列高频重点提示

- **Using index**：🎉 最佳状态！使用了**覆盖索引**，不需要回表查询聚簇索引。
- **Using where**：存储引擎检索记录后，Server 层使用 `WHERE` 条件进一步过滤。
- **Using index condition (ICP)**：**索引条件下推**！在二级索引遍历时即可提前过滤部分条件，极大减少回表次数。
- **Using filesort**：无法利用索引完成排序，需要占用内存（甚至临时文件）进行额外排序。
- **Using temporary**：需要创建内部临时表处理查询（如 `DISTINCT` 或不带索引的 `GROUP BY`）。
