class ObjectPool<T> {
  final _pool = <T>[];
  T acquire(T Function() create) => _pool.isNotEmpty ? _pool.removeLast() : create();
  void release(T item) => _pool.add(item);
}
