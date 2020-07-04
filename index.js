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

wsClient.onConnected(() => {
  console.log('Connected to subscription client!');

  const link = new WebSocketLink(wsClient);

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });

  const runTest = async () => {
    if (argv.query) {
      console.log('Start query test');
      try {
        const result = await apolloClient.query({
          query: gql`${argv.query}`,
        });
        console.log('Apollo query success', JSON.stringify(result));
      } catch (error) {
        console.log('Apollo query error', JSON.stringify(error));
        process.exit(1);
      }
    }

    if (argv.mutation) {
      console.log('Start mutation test');
      try {
        const result = await apolloClient.mutate({
          mutation: gql`${argv.mutation}`,
        });
        console.log('Apollo mutation success', JSON.stringify(result));
      } catch (error) {
        console.log('Apollo mutation error', JSON.stringify(error));
        process.exit(1);
      }
    }

    process.exit();
  };

  if (!argv.query && !argv.mutation) {
    console.log('No query or mutation specified')
    process.exit(1);
  }

  runTest();
});
wsClient.onError(error => {
  console.log('Websocket client error', JSON.stringify(error))
  process.exit(1);
});
wsClient.onDisconnected(error => {
  console.log('Websocket client disconnected', JSON.stringify(error))
  process.exit(1);
})