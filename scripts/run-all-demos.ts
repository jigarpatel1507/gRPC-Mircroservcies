import { runUnaryDemo } from './run-unary-demo.js';
import { runServerStreamingDemo } from './run-server-streaming-demo.js';
import { runBidiStreamingDemo } from './run-bidi-streaming-demo.js';
import { runAuthDemo } from './run-auth-demo.js';

async function runAll() {
  console.log('================================================================');
  console.log('🚀 RUNNING ALL 4 gRPC DEMONSTRATIONS IN SEQUENCE');
  console.log('================================================================\n');

  try {
    console.log('>>> [1/4] EXECUTING UNARY RPC DEMO <<<');
    await runUnaryDemo();

    console.log('>>> [2/4] EXECUTING SERVER STREAMING DEMO <<<');
    await runServerStreamingDemo();

    console.log('>>> [3/4] EXECUTING BI-DIRECTIONAL STREAMING DEMO <<<');
    await runBidiStreamingDemo();

    console.log('>>> [4/4] EXECUTING AUTHENTICATION FLOW DEMO <<<');
    await runAuthDemo();

    console.log('================================================================');
    console.log('🎉 ALL 4 gRPC DEMONSTRATIONS EXECUTED AND PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Error executing demonstrations sequence:', err);
    process.exit(1);
  }
}

runAll();
