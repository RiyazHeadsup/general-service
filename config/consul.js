const consul = require('consul');

class ConsulConfig {
  constructor(options = {}) {
    this.consul = consul({
      host: process.env.CONSUL_HOST || '127.0.0.1',
      port: process.env.CONSUL_PORT || 8500
    });
    
    this.serviceName = process.env.SERVICE_NAME || 'generalservice';
    // ✅ FIX: Use PORT instead of SERVICE_PORT to match docker-compose.yml
    this.servicePort = options.servicePort || parseInt(process.env.PORT) || 3003;
    // ✅ FIX: Use SERVICE_ADDRESS and default to general-service
    this.serviceHost = process.env.SERVICE_ADDRESS || 'general-service';
  }

  async registerService() {
    try {
      const serviceDefinition = {
        name: this.serviceName,
        id: `${this.serviceName}-${this.servicePort}`,
        address: this.serviceHost,
        port: this.servicePort,
        check: {
          http: `http://${this.serviceHost}:${this.servicePort}/health`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s'
        },
        tags: ['general', 'utilities', 'microservice']
      };

      await new Promise((resolve, reject) => {
        this.consul.agent.service.register(serviceDefinition, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log(`✅ Service ${this.serviceName} registered with Consul at ${this.serviceHost}:${this.servicePort}`);
    } catch (error) {
      console.error('❌ Failed to register service with Consul:', error.message);
      console.log('🔄 Service will continue without Consul registration');
    }
  }

  async deregisterService() {
    try {
      const serviceId = `${this.serviceName}-${this.servicePort}`;
      
      await new Promise((resolve, reject) => {
        this.consul.agent.service.deregister(serviceId, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log(`🛑 Service ${this.serviceName} deregistered from Consul`);
    } catch (error) {
      console.error('❌ Failed to deregister service from Consul:', error.message);
    }
  }

  getConsul() {
    return this.consul;
  }

  getServiceInfo() {
    return {
      name: this.serviceName,
      host: this.serviceHost,
      port: this.servicePort
    };
  }
}

module.exports = ConsulConfig;