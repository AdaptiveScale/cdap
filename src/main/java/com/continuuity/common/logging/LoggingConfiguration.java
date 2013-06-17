package com.continuuity.common.logging;

import com.google.common.base.Splitter;
import com.google.common.collect.Lists;

import java.util.Iterator;
import java.util.List;

/**
 * Logging configuration helper.
 */
public class LoggingConfiguration {
  public static final String NUM_PARTITONS = "log.publish.num.partitions";
  public static final String KAFKA_SEED_BROKERS = "kafka.seed.brokers";
  public static final String LOG_PATTERN = "log.pattern";

  /**
   * Given a string of format "host1:port1,host2:port2", the function returns a list of Kafka hosts.
   * @param seedBrokers String to parse the host/port list from.
   * @return list of Kafka hosts.
   */
  public static List<KafkaHost> getKafkaSeedBrokers(String seedBrokers) {
    List<KafkaHost> kafkaHosts = Lists.newArrayList();
    for (String hostPort : Splitter.on(",").trimResults().split(seedBrokers)) {
      Iterable<String> hostPortList = Splitter.on(":").trimResults().split(hostPort);

      Iterator<String> it = hostPortList.iterator();
      kafkaHosts.add(new KafkaHost(it.next(), Integer.parseInt(it.next())));
    }
    return kafkaHosts;
  }

  public static class KafkaHost {
    private final String hostname;
    private final int port;

    public KafkaHost(String hostname, int port) {
      this.hostname = hostname;
      this.port = port;
    }

    public String getHostname() {
      return hostname;
    }

    public int getPort() {
      return port;
    }
  }
}
