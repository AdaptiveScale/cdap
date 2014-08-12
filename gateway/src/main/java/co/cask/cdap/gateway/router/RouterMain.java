/*
 * Copyright 2014 Cask, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package co.cask.cdap.gateway.router;

import co.cask.cdap.common.conf.CConfiguration;
import co.cask.cdap.common.conf.Constants;
import co.cask.cdap.common.guice.ConfigModule;
import co.cask.cdap.common.guice.DiscoveryRuntimeModule;
import co.cask.cdap.common.guice.IOModule;
import co.cask.cdap.common.guice.LocationRuntimeModule;
import co.cask.cdap.common.guice.ZKClientModule;
import co.cask.cdap.common.kerberos.KerberosUtil;
import co.cask.cdap.common.runtime.DaemonMain;
import co.cask.cdap.common.utils.DirUtils;
import co.cask.cdap.gateway.auth.AuthModule;
import co.cask.cdap.security.guice.SecurityModules;
import com.google.common.base.Throwables;
import com.google.common.io.Files;
import com.google.common.util.concurrent.Futures;
import com.google.inject.Guice;
import com.google.inject.Injector;
import org.apache.twill.common.Services;
import org.apache.twill.discovery.DiscoveryService;
import org.apache.twill.zookeeper.ZKClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;

/**
 * Main class to run Router from command line.
 */
public class RouterMain extends DaemonMain {
  private static final Logger LOG = LoggerFactory.getLogger(RouterMain.class);

  private ZKClientService zkClientService;
  private NettyRouter router;
  private DiscoveryService discoveryService;
  private File tmpDir;

  public static void main(String[] args) {
    try {
      new RouterMain().doMain(args);
    } catch (Throwable e) {
      LOG.error("Got exception", e);
    }
  }

  @Override
  public void init(String[] args) {
    LOG.info("Initializing Router...");
    try {
      // Load configuration
      CConfiguration cConf = CConfiguration.create();

      tmpDir = Files.createTempDir();
      KerberosUtil.enable(tmpDir, new File(cConf.get(Constants.Security.CFG_CDAP_MASTER_KRB_KEYTAB_PATH)),
                          cConf.get(Constants.Security.CFG_CDAP_MASTER_KRB_PRINCIPAL));

      // Initialize ZK client
      String zookeeper = cConf.get(Constants.Zookeeper.QUORUM);
      if (zookeeper == null) {
        LOG.error("No zookeeper quorum provided.");
        System.exit(1);
      }

      Injector injector = createGuiceInjector(cConf);
      zkClientService = injector.getInstance(ZKClientService.class);

      // Get the Router
      router = injector.getInstance(NettyRouter.class);

      //Get the discovery service
      discoveryService = injector.getInstance(DiscoveryService.class);

      LOG.info("Router initialized.");
    } catch (Throwable t) {
      LOG.error(t.getMessage(), t);
      throw Throwables.propagate(t);
    }
  }

  @Override
  public void start() {
    LOG.info("Starting Router...");
    Futures.getUnchecked(Services.chainStart(zkClientService, router));
    LOG.info("Router started.");
  }

  @Override
  public void stop() {
    LOG.info("Stopping Router...");
    Futures.getUnchecked(Services.chainStop(router, zkClientService));
    if (tmpDir != null) {
      try {
        DirUtils.deleteDirectoryContents(tmpDir);
      } catch (IOException e) {
        LOG.warn("Couldn't delete temporary directory '{}'", tmpDir.getAbsolutePath());
      }
    }
    LOG.info("Router stopped.");
  }

  @Override
  public void destroy() {
    // Nothing to do
  }

  static Injector createGuiceInjector(CConfiguration cConf) {
    return Guice.createInjector(
      new ConfigModule(cConf),
      new ZKClientModule(),
      new LocationRuntimeModule().getDistributedModules(),
      new DiscoveryRuntimeModule().getDistributedModules(),
      new RouterModules().getDistributedModules(),
      new SecurityModules().getDistributedModules(),
      new AuthModule(),
      new IOModule()
    );
  }
}
