import { argv } from 'yargs';
import * as ws from 'ws';
import { ApolloClient, gql } from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const wsClient = new SubscriptionClient(
  argv.endpoint,
  { lazy: false, reconnect: true },
  ws,
  []
);

let success = false;

wsClient.onConnected(() => {
  console.log('Connected to subscription client!')

  const link = new WebSocketLink(wsClient);

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });

  if (!argv.query) {
    console.log('No query specified')
    process.exit()
  }

  apolloClient.query({
    query: gql`${argv.query}`,
  }).then(result => {
    console.log('Apollo success', JSON.stringify(result))
    success = true
  }).catch(error => {
    console.log('Apollo error', JSON.stringify(error))
    process.exit(1)
  })

});
wsClient.onError(error => {
  console.log('Websocket client error', JSON.stringify(error))
  process.exit(1)
});
wsClient.onDisconnected(error => {
  console.log('Websocket client disconnected', JSON.stringify(error))
  process.exit(1)
})

setTimeout(() => {
  if (success) {
    process.exit(0);
  } else {
    console.log('Apollo server timed out!')
    process.exit(1);
  }
}, Number.parseInt(argv.timeout))