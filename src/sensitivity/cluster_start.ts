import cluster from 'cluster';
import http from 'http';
import { cpus } from 'os';
import process from 'process';

/**
 * Might look something like this:
 * 
 * Primary reads simulation.json and input_params.txt
 * Decides how many workers, N, to spin up. (1 less than ALL CPUs)
 * Divides the input_params into N groups
 * Sends input_params group to applicable worker
 * After worker finishes each, it reports completion rate and
 *      writes file with correct ID
 * 
 * Master periodically prints out progress of each
 * When master gets all, it terminates
 */

if (cluster.isMaster) {

  // Keep track of http requests
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Count requests
  function messageHandler(msg: any) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Start workers and listen for messages containing notifyRequest
  const numCPUs = cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id]?.on('message', messageHandler);
  }

} else {

  // Worker processes have a http server.
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // Notify primary about the request
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}