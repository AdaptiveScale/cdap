package com.continuuity.data2.dataset2;

import com.continuuity.data2.dataset2.module.lib.TableModule;
import com.continuuity.data2.dataset2.module.lib.inmemory.InMemoryTableModule;
import com.continuuity.data2.transaction.DefaultTransactionExecutor;
import com.continuuity.data2.transaction.TransactionAware;
import com.continuuity.data2.transaction.TransactionExecutor;
import com.continuuity.data2.transaction.inmemory.MinimalTxSystemClient;
import com.continuuity.internal.data.dataset.Dataset;
import com.continuuity.internal.data.dataset.DatasetInstanceProperties;
import com.continuuity.internal.data.dataset.module.DatasetModule;
import com.google.common.base.Preconditions;
import org.junit.After;
import org.junit.Before;

import java.io.IOException;

/**
 *
 */
public class AbstractDatasetTest {

  private DatasetFramework framework;

  @Before
  public void setUp() throws Exception {
    framework = new InMemoryDatasetFramework();
    framework.register("inMemory", InMemoryTableModule.class);
    framework.register("table", TableModule.class);
  }

  @After
  public void tearDown() throws Exception {
    framework.deleteModule("table");
    framework.deleteModule("inMemory");
  }

  protected void registerModule(String name, Class<? extends DatasetModule> cls) throws DatasetManagementException {
    framework.register(name, cls);
  }

  protected void deleteModule(String name) throws DatasetManagementException {
    framework.deleteModule(name);
  }

  protected void createInstance(String type, String instanceName, DatasetInstanceProperties properties)
    throws IOException, DatasetManagementException {

    framework.addInstance(type, instanceName, properties);
  }

  protected void deleteInstance(String instanceName) throws IOException, DatasetManagementException {
    framework.deleteInstance(instanceName);
  }

  protected <T extends Dataset> T getInstance(String datasetName) throws DatasetManagementException, IOException {
    return framework.getDataset(datasetName, null);
  }

  protected TransactionExecutor newTransactionExecutor(TransactionAware...tables) {
    Preconditions.checkArgument(tables != null);
    return new DefaultTransactionExecutor(new MinimalTxSystemClient(), tables);
  }

}
