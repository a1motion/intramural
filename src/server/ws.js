module.exports = (ws, req) => {
  ws.subscribed = []
  ws.on(`message`, (msg) => {
    const data = JSON.parse(msg)
    if (data.subscribe) {
      const [type, id] = data.subscribe.split(`:`)
      if (type === `logs`) {
        ws.subscribed.push({ logs: id })
      }
    } else if (data.unsubscribe) {
      const [type, id] = data.unsubscribe.split(`:`)
      ws.subscribed = ws.subscribed.filter(
        (subs) => !(subs[type] && subs[type] === id)
      )
    }
  })
}
