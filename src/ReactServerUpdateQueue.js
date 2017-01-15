class ReactServerUpdateQueue {
  isMounted() {
    return false;
  }

  enqueueForceUpdate() {}

  enqueueReplaceState() {}

  enqueueSetState() {}
}

module.exports = ReactServerUpdateQueue;
