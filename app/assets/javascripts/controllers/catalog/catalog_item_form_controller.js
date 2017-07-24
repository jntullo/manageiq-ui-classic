ManageIQ.angular.app.controller('catalogItemFormController', ['$scope', 'catalogItemFormId', 'currentRegion', 'miqService', 'postService', 'API', 'catalogItemDataFactory', function($scope, catalogItemFormId, currentRegion, miqService, postService, API, catalogItemDataFactory) {
  var vm = this;
  var sort_options = "&sort_by=name&sort_order=ascending"
  var init = function() {
    vm.catalogItemModel = {
      name: '',
      description: '',
      display: false,
      prov_type: 'generic_ansible_playbook',
      catalog_id: '',
      key: '',
      key_value: '',
      provisioning_repository_id: '',
      provisioning_playbook_id: '',
      provisioning_machine_credential_id: '',
      provisioning_network_credential_id: '',
      provisioning_cloud_credential_id: '',
      provisioning_playbook_ttl: '',
      provisioning_inventory: 'localhost',
      provisioning_dialog_existing: 'existing',
      provisioning_dialog_id: '',
      provisioning_dialog_name: '',
      provisioning_key: '',
      provisioning_value: '',
      provisioning_variables: {},
      provisioning_become_enabled: false,
      provisioning_verbosity: '0',
      provisioning_editMode: false,
      retirement_repository_id: '',
      retirement_playbook_id: '',
      retirement_machine_credential_id: '',
      retirement_network_credential_id: '',
      retirement_cloud_credential_id: '',
      retirement_playbook_ttl: '',
      retirement_inventory: 'localhost',
      retirement_key: '',
      retirement_value: '',
      retirement_variables: {},
      retirement_editMode: false,
      retirement_become_enabled: false,
      retirement_verbosity: '0',
    };
    getVerbosityTypes();
    getRemoveResourcesTypes();
    vm.provisioning_cloud_type = '';
    vm.retirement_cloud_type = '';
    vm.currentRegion = currentRegion;
    vm.formId = catalogItemFormId;
    vm.afterGet = false;
    vm.model = "catalogItemModel";

    ManageIQ.angular.scope = $scope;

    if (catalogItemFormId == 'new') {
      $scope.newRecord = true;
      vm.formOptions();
      vm.formCloudCredentials(null, null);
      vm.afterGet = true;
      vm.modelCopy = angular.copy(vm.catalogItemModel);
    } else {
      vm.newRecord = false;
      catalogItemDataFactory.getCatalogItemData(catalogItemFormId).then(function (catalogItemData) {
        $scope.newRecord = false;
        vm.catalogItemModel.name = catalogItemData.name;
        vm.catalogItemModel.description = catalogItemData.description;
        vm.catalogItemModel.display = catalogItemData.display;
        vm.catalogItemModel.catalog_id = catalogItemData.service_template_catalog_id;
        vm.catalogItemModel.provisioning_dialog_id = catalogItemData.provisioning_dialog_id;
        vm.formOptions();
        vm.formCloudCredentials(catalogItemData.config_info.provision.cloud_credential_id, catalogItemData.config_info.retirement.cloud_credential_id);
        getConfigInfo(catalogItemData.config_info);
        vm.afterGet = true;
        vm.modelCopy = angular.copy(vm.catalogItemModel);
      });
    }
  };

  var getVerbosityTypes = function() {
    vm['verbosity_types'] = {
      "0": "0 (Normal)",
      "1": "1 (Verbose)",
      "2": "2 (More Verbose)",
      "3": "3 (Debug)",
      "4": "4 (Connection Debug)",
      "5": "5 (WinRM Debug)"
    };
  }

  var getRemoveResourcesTypes = function () {
    if (vm.catalogItemModel.retirement_repository_id === undefined || vm.catalogItemModel.retirement_repository_id === '') {
      vm.catalogItemModel.retirement_remove_resources = 'yes_without_playbook';
      vm['remove_resources_types'] = {
        "No": "no_without_playbook",
        "Yes": "yes_without_playbook"
      };
    } else {
      vm.catalogItemModel.retirement_remove_resources = 'no_with_playbook';
      vm['remove_resources_types'] = {
        "No": "no_with_playbook",
        "Before Playbook runs": "pre_with_playbook",
        "After Playbook runs": "post_with_playbook"
      };
    }
  }

  var getCredentialType = function (prefix, credentialId) {
    var url = '/api/authentications/' + credentialId;
    API.get(url).then(function (data) {
      vm[prefix + '_cloud_type'] = data.type;

      if (vm.cloud_types[vm[prefix + '_cloud_type']] !== 'undefined') {
        vm['_' + prefix + '_cloud_type'] = data.type;
        getCloudCredentialsforType(prefix, data.type);
      }
    })
  };

  var setIfDefined = function(value) {
    return (typeof value !== 'undefined') ? value : '';
  };

  var getConfigInfo = function (configData) {
    vm.catalogItemModel.provisioning_repository_id = configData.provision.repository_id;
    vm.catalogItemModel.provisioning_playbook_id = configData.provision.playbook_id;
    vm.catalogItemModel.provisioning_machine_credential_id = configData.provision.credential_id;
    vm.catalogItemModel.provisioning_network_credential_id = configData.provision.network_credential_id;
    vm.catalogItemModel.provisioning_cloud_credential_id = setIfDefined(configData.provision.cloud_credential_id);
    vm.catalogItemModel.provisioning_playbook_ttl = configData.provision.playbook_ttl;
    vm.catalogItemModel.provisioning_inventory = configData.provision.hosts;
    vm.catalogItemModel.provisioning_dialog_existing = configData.provision.dialog_id ? "existing" : "create";
    vm.catalogItemModel.provisioning_dialog_id = configData.provision.dialog_id;
    vm.catalogItemModel.provisioning_dialog_name = configData.provision.new_dialog_name;
    vm.catalogItemModel.provisioning_key = '';
    vm.catalogItemModel.provisioning_value = '';
    if (configData.provision.become_enabled === undefined) {
      vm.catalogItemModel.provisioning_become_enabled = false;
    } else {
      vm.catalogItemModel.provisioning_become_enabled = configData.provision.become_enabled;
    }

    if (configData.provision.verbosity === undefined) {
      vm.catalogItemModel.provisioning_verbosity = '0';
    } else {
      vm.catalogItemModel.provisioning_verbosity = configData.provision.verbosity;
    }

    setExtraVars('provisioning_variables', configData.provision.extra_vars);

    if (typeof configData.retirement.repository_id !== 'undefined') {
      vm.catalogItemModel.retirement_repository_id = configData.retirement.repository_id;
      vm.catalogItemModel.retirement_playbook_id = configData.retirement.playbook_id;
      getRemoveResourcesTypes();
      vm.catalogItemModel.retirement_remove_resources = configData.retirement.remove_resources;
      vm.catalogItemModel.retirement_machine_credential_id = configData.retirement.credential_id;
    }
    if (configData.retirement.become_enabled === undefined) {
      vm.catalogItemModel.retirement_become_enabled = false;
    } else {
      vm.catalogItemModel.retirement_become_enabled = configData.retirement.become_enabled;
    }

    if (configData.retirement.verbosity === undefined) {
      vm.catalogItemModel.retirement_verbosity = '0';
    } else {
      vm.catalogItemModel.retirement_verbosity = configData.retirement.verbosity;
    }

    vm.catalogItemModel.retirement_network_credential_id = configData.retirement.network_credential_id;
    vm.catalogItemModel.retirement_cloud_credential_id = setIfDefined(configData.retirement.cloud_credential_id);
    vm.catalogItemModel.retirement_playbook_ttl = configData.retirement.playbook_ttl;
    vm.catalogItemModel.retirement_inventory = configData.retirement.hosts;
    vm.catalogItemModel.retirement_key = '';
    vm.catalogItemModel.retirement_value = '';
    setExtraVars('retirement_variables', configData.retirement.extra_vars);
  };

  var setExtraVars = function (variableName, extraVars) {
    if (typeof extraVars !== 'undefined') {
      vm.catalogItemModel[variableName] = {};
      for (var key in extraVars) {
        vm.catalogItemModel[variableName][key] = extraVars[key]['default'];
      }
    }
    $scope.checkFormPristine();
  }

  var redirectUrl = '/catalog/explorer/' + catalogItemFormId;

  $scope.cancelClicked = function() {
    if ($scope.newRecord)
      var msg = sprintf(__("Add of Catalog Item was cancelled by the user"));
    else
      var msg = sprintf(__("Edit of Catalog Item %s was cancelled by the user"), vm.catalogItemModel.description);
    postService.cancelOperation('/catalog/explorer?', msg);
    $scope.angularForm.$setPristine(true);
  };

  $scope.resetClicked = function() {
    vm.catalogItemModel = angular.copy(vm.modelCopy);
    vm.formOptions();
    cloudCredentialsList(vm.catalogItemModel.provisioning_cloud_credential_id, vm.catalogItemModel.retirement_cloud_credential_id);
    $scope.angularForm.$setUntouched(true);
    $scope.angularForm.$setPristine(true);
    miqService.miqFlash("warn", __("All changes have been reset"));
  };

  $scope.saveClicked = function() {
    var successMsg = sprintf(__("Catalog Item %s was saved"), vm.catalogItemModel.name);
    postService.saveRecord('/api/service_templates/' + catalogItemFormId,
      redirectUrl + '?button=save',
      setConfigInfo(vm.catalogItemModel),
      successMsg);
    $scope.angularForm.$setPristine(true);
  };

  $scope.addClicked = function($event, formSubmit) {
    var successMsg = sprintf(__("Catalog Item %s was added"), vm.catalogItemModel.name);
    postService.createRecord('/api/service_templates',
      redirectUrl + '?button=add',
      setConfigInfo(vm.catalogItemModel),
      successMsg);
    $scope.angularForm.$setPristine(true);
  };

  var formatExtraVars = function(extraVars){
    if (typeof extraVars !== 'undefined') {
      formattedExtraVars = {};
      for (var key in extraVars) {
        formattedExtraVars[key] = {'default': extraVars[key]};
      }
    }
    return formattedExtraVars;
  }

  var setConfigInfo = function(configData) {
    catalog_item = {
      name: configData.name,
      description: configData.description,
      display: configData.display,
      service_template_catalog_id: configData.catalog_id,
      prov_type: "generic_ansible_playbook",
      type: "ServiceTemplateAnsiblePlaybook",
      config_info: {
        provision: {
          repository_id: configData.provisioning_repository_id,
          playbook_id: configData.provisioning_playbook_id,
          credential_id: configData.provisioning_machine_credential_id,
          hosts: configData.provisioning_inventory,
          verbosity: configData.provisioning_verbosity,
          extra_vars: formatExtraVars(configData.provisioning_variables)
        }
      }
    }
    if (vm.catalogItemModel.provisioning_playbook_ttl !== undefined)
      catalog_item['config_info']['provision']['playbook_ttl'] = configData.provisioning_playbook_ttl;
    catalog_item['config_info']['provision']['become_enabled'] = configData.provisioning_become_enabled;
    if (configData.provisioning_network_credential_id !== '')
      catalog_item['config_info']['provision']['network_credential_id'] = configData.provisioning_network_credential_id;

    if (configData.provisioning_cloud_credential_id !== '')
      catalog_item['config_info']['provision']['cloud_credential_id'] = configData.provisioning_cloud_credential_id;

    if (configData.provisioning_dialog_id !== undefined && configData.provisioning_dialog_id !== '') {
      catalog_item['config_info']['provision']['dialog_id'] = configData.provisioning_dialog_id;
    } else if (configData.provisioning_dialog_name !== '')
      catalog_item['config_info']['provision']['new_dialog_name'] = configData.provisioning_dialog_name;

    catalog_item['config_info']['retirement'] = {
      remove_resources: configData.retirement_remove_resources,
      verbosity: configData.retirement_verbosity
    }

    var retirement = catalog_item['config_info']['retirement'];
    if (vm.catalogItemModel.retirement_repository_id !== undefined && configData.retirement_repository_id !== '') {
      retirement['repository_id'] = configData.retirement_repository_id;
      retirement['playbook_id'] = configData.retirement_playbook_id;
      retirement['credential_id'] = configData.retirement_machine_credential_id;
    }
    if (vm.catalogItemModel.retirement_playbook_id !== undefined && configData.retirement_playbook_id !== '') {
      if (vm.catalogItemModel.retirement_playbook_ttl !== undefined)
        retirement['playbook_ttl'] = configData.retirement_playbook_ttl;
      retirement['hosts'] = configData.retirement_inventory;
      retirement['extra_vars'] = formatExtraVars(configData.retirement_variables);
      catalog_item['config_info']['retirement']['become_enabled'] = configData.retirement_become_enabled;
    }
    if (configData.retirement_network_credential_id !== '')
      catalog_item['config_info']['retirement']['network_credential_id'] = configData.retirement_network_credential_id;

    if (configData.retirement_cloud_credential_id !== '')
      catalog_item['config_info']['retirement']['cloud_credential_id'] = configData.retirement_cloud_credential_id;

    return catalog_item;
  }


  // list of service catalogs
  vm.formOptions = function() {
    API.get("/api/service_catalogs/?expand=resources&attributes=id,name" + sort_options).then(function(data) {
      vm.catalogs = data.resources;
      vm._catalog = _.find(vm.catalogs, {id: vm.catalogItemModel.catalog_id});
    })

    // list of service dialogs
    API.get("/api/service_dialogs/?expand=resources&attributes=id,label&sort_by=label&sort_order=ascending").then(function(data) {
      vm.dialogs = data.resources
      vm._provisioning_dialog = _.find(vm.dialogs, {id: vm.catalogItemModel.provisioning_dialog_id});
    })

    // list of repositories
    API.get("/api/configuration_script_sources?collection_class=ManageIQ::Providers::EmbeddedAnsible::AutomationManager::ConfigurationScriptSource&expand=resources&attributes=id,name&filter[]=region_number=" + vm.currentRegion + sort_options).then(function(data) {
      vm.repositories = data.resources;
      vm._retirement_repository = _.find(vm.repositories, {id: vm.catalogItemModel.retirement_repository_id});
      vm._provisioning_repository = _.find(vm.repositories, {id: vm.catalogItemModel.provisioning_repository_id});
    })

    // list of machine credentials
    API.get("/api/authentications?collection_class=ManageIQ::Providers::EmbeddedAnsible::AutomationManager::MachineCredential&expand=resources&attributes=id,name" + sort_options).then(function(data) {
      vm.machine_credentials = data.resources;
      vm._retirement_machine_credential = _.find(vm.machine_credentials, {id: vm.catalogItemModel.retirement_machine_credential_id});
      vm._provisioning_machine_credential = _.find(vm.machine_credentials, {id: vm.catalogItemModel.provisioning_machine_credential_id});
    })

    // list of network credentials
    API.get("/api/authentications?collection_class=ManageIQ::Providers::EmbeddedAnsible::AutomationManager::NetworkCredential&expand=resources&attributes=id,name" + sort_options).then(function(data) {
      vm.network_credentials = data.resources;
      vm._retirement_network_credential = _.find(vm.network_credentials, {id: vm.catalogItemModel.retirement_network_credential_id});
      vm._provisioning_network_credential = _.find(vm.network_credentials, {id: vm.catalogItemModel.provisioning_network_credential_id});
    })
  };

  // list of cloud credentials
  vm.formCloudCredentials = function(provisionCredentialId, retirementCredentialId) {
    API.options('/api/authentications').then(function(data) {
      var cloud_types = {};
      angular.forEach(data.data.credential_types.embedded_ansible_credential_types, function(cred_object, cred_type) {
        if (cred_object.type == 'cloud')
          cloud_types[cred_type] = cred_object.label;
      });
      vm.cloud_types = getSortedHash(cloud_types);
      cloudCredentialsList(provisionCredentialId, retirementCredentialId);
    });
  };

  var cloudCredentialsList = function(provisionCredentialId, retirementCredentialId) {
    if (provisionCredentialId) {
      getCredentialType('provisioning', provisionCredentialId);
    } else {
      vm._provisioning_cloud_type = '';
      vm._provisioning_cloud_credential_id = '';
    }
    if (retirementCredentialId) {
      getCredentialType('retirement', retirementCredentialId);
    } else {
      vm._retirement_cloud_type = '';
      vm._retirement_cloud_credential_id = '';
    }
  };

  var getSortedHash = function(inputHash) {
    var sortedHash = Object.keys(inputHash)
      .map(function(key) {
        return ({"k": key, "v": inputHash[key]})
      })
      .sort(function(a, b) {
        return a.v.localeCompare(b.v)
      })
      .reduce(function(o, e) {
        o[e.k] = e.v;
        return o;
      }, {});
    return sortedHash;
  };

  // get playbooks for selected repository
  vm.repositoryChanged = function(prefix, id) {
    API.get("/api/configuration_script_sources/" + id + "/configuration_script_payloads?expand=resources&filter[]=region_number=" + vm.currentRegion + sort_options).then(function (data) {
      vm[prefix + '_playbooks'] = data.resources;
      // if repository has changed
      if (id !== vm.catalogItemModel[prefix + '_repository_id']) {
        vm.catalogItemModel[prefix + '_playbook_id'] = '';
        vm.catalogItemModel[prefix + '_repository_id'] = id;
        getRemoveResourcesTypes();
      } else {
        findObjectForDropDown(prefix, '_playbook', '_playbooks');
      }
    })
  };

  // reset fields when retirement playbook type is changed
  $scope.$watch('vm._retirement_playbook', function(value) {
    if (value && (vm.catalogItemModel.retirement_inventory === undefined || vm.catalogItemModel.retirement_inventory === '')) {
      vm.catalogItemModel.retirement_inventory = 'localhost';
      vm.catalogItemModel.retirement_become_enabled = false;
    }
  });

  $scope.$watch('vm._provisioning_repository', function(value) {
    if (value) {
      vm.repositoryChanged("provisioning", value.id)
    } else {
      vm.catalogItemModel['provisioning_repository_id'] = '';
    }
    $scope.checkFormPristine();
  });

  $scope.$watch('vm._retirement_repository', function(value) {
    if (value) {
      vm.repositoryChanged("retirement", value.id)
    } else {
      vm.catalogItemModel['retirement_playbook_id'] = '';
      vm.catalogItemModel['retirement_repository_id'] = '';
      getRemoveResourcesTypes();
    }
    $scope.checkFormPristine();
  });

  $scope.checkFormPristine = function() {
    if (angular.equals(vm.catalogItemModel, vm.modelCopy)) {
      $scope.angularForm.$setPristine();
    } else {
      $scope.angularForm.$setDirty();
    }
  };

  $scope.cloudTypeChanged = function(prefix, value) {
    var valueChanged = (value !== vm[prefix + '_cloud_type']);
    if (value) {
      vm[prefix + '_cloud_type'] = value;
    } else {
      vm[prefix + '_cloud_type'] = '';
    }
    if (valueChanged) {
      var typ = vm[prefix + "_cloud_type"];
      vm.catalogItemModel[prefix + '_cloud_credential_id'] = '';
      getCloudCredentialsforType(prefix, typ);
    }
    $scope.checkFormPristine();
  };

  var getCloudCredentialsforType = function(prefix, typ) {
    // list of cloud credentials based upon selected cloud type
    var url = '/api/authentications?collection_class=' + typ + '&expand=resources&attributes=id,name' + sort_options;
    API.get(url).then(function(data) {
      vm[prefix + '_cloud_credentials'] = data.resources;
      findObjectForDropDown(prefix, '_cloud_credential', '_cloud_credentials');
    })
  };

  var findObjectForDropDown = function(prefix, fieldName, listName) {
    vm['_' + prefix + fieldName] = _.find(vm[prefix + listName], {id: vm.catalogItemModel[prefix + fieldName + '_id']});
    $scope.checkFormPristine();
  };

  $scope.$watch('vm._retirement_playbook', function(value) {
    if (value) {
      vm.catalogItemModel['retirement_playbook_id'] = value.id;
    } else {
      vm.catalogItemModel['retirement_playbook_id'] = '';
    }
    $scope.checkFormPristine();
  });

  $scope.$watch('vm.catalogItemModel.display', function(value) {
    vm.catalogItemModel.display = value;
    return vm.catalogItemModel.display;
  })

  $scope.$watch('vm._provisioning_cloud_type', function(value) {
    $scope.cloudTypeChanged("provisioning", value);
  })

  $scope.$watch('vm._retirement_cloud_type', function(value) {
    $scope.cloudTypeChanged("retirement", value);
  })

  vm.addKeyValue = function(prefix) {
    vm.catalogItemModel[prefix + "_variables"][vm.catalogItemModel[prefix + "_key"]] =  vm.catalogItemModel[prefix + "_value"];
    vm.catalogItemModel[prefix + "_key"] = '';
    vm.catalogItemModel[prefix + "_value"] = '';
  }

  vm.provisioning_repository_selected = function() {
    return vm.catalogItemModel.provisioning_repository_id !== '';
  }

  vm.retirement_repository_selected = function() {
    return vm.catalogItemModel.retirement_repository_id !== '';
  }

  vm.retirement_playbook_selected = function(prefix) {
    if (prefix === "provisioning")
      return true;
    return vm.catalogItemModel.retirement_playbook_id !== '';
  }

  vm.removeKeyValue = function(prefix, key) {
    delete vm.catalogItemModel[prefix + "_variables"][key];
    $scope.checkFormPristine();
  }

  vm.editKeyValue = function(prefix, key, key_value, index) {
    vm.catalogItemModel[prefix + "_editMode"] = true;
    vm.catalogItemModel.s_index = index;
    vm.catalogItemModel.key = key;
    vm.catalogItemModel.key_value = key_value;
    vm.catalogItemModel.original_key = key;
    vm.catalogItemModel.original_key_value = key_value;
  }

  vm.cancelKeyValue = function(prefix) {
    vm.catalogItemModel[prefix + "_editMode"] = false;
    vm.catalogItemModel.s_index = '';
    vm.catalogItemModel[prefix + "_variables"][vm.catalogItemModel.original_key] = vm.catalogItemModel.original_key_value;
  }

  vm.saveKeyValue = function(prefix, index) {
    vm.catalogItemModel[prefix + "_editMode"] = false;
    vm.catalogItemModel.s_index = '';
    // delete key if key name was edited, and a add new key to hash with new name
    if (vm.catalogItemModel.original_key !== vm.catalogItemModel.key)
      delete vm.catalogItemModel[prefix + "_variables"][vm.catalogItemModel.original_key];

    vm.catalogItemModel[prefix + "_variables"][vm.catalogItemModel.key] = vm.catalogItemModel.key_value;
  }

  vm.toggleDialogSelection = function(prefix, selected_value) {
    vm.catalogItemModel[prefix + "_dialog_existing"] = selected_value;
    vm._provisioning_dialog = ""
    vm.catalogItemModel[prefix + "_dialog_id"] = ""
    vm.catalogItemModel[prefix  + "_dialog_name"] = ""
  };

  vm.fieldsRequired = function(prefix) {
    return prefix == "provisioning";
  };

  vm.variablesEmpty = function(prefix) {
    field = vm.catalogItemModel[prefix + "_variables"];
    return Object.keys(field).length === 0;
  };

  // watch for all the drop downs on screen
  "catalog provisioning_playbook retirement_playbook provisioning_machine_credential retirement_machine_credential provisioning_network_credential retirement_network_credential provisioning_cloud_credential retirement_cloud_credential provisioning_dialog".split(" ").forEach(idWatch)

  function idWatch(name) {
    field_name = "vm._" + name;
    $scope.$watch(field_name, function(value) {
      if (value)
        vm.catalogItemModel[name + '_id'] = value.id;
      $scope.checkFormPristine();
    });
  }

   // watch for all the drop downs on screen
  "retirement_remove_resources".split(" ").forEach(typeWatch)

  function typeWatch(name) {
    field_name = "vm.catalogItemModel." + name;
    $scope.$watch(field_name, function(value) {
      if (value)
        vm.catalogItemModel[name] = value;
      $scope.checkFormPristine();
    });
  }

  $scope.cancelCopyProvisioning = function() {
    closeConfirmationModal();
  }

  $scope.copyProvisioning = function() {
    closeConfirmationModal();
    vm.formOptions();
    vm.catalogItemModel.retirement_repository_id = vm.catalogItemModel.provisioning_repository_id;
    vm.catalogItemModel.retirement_playbook_id = vm.catalogItemModel.provisioning_playbook_id;
    vm.catalogItemModel.retirement_machine_credential_id = vm.catalogItemModel.provisioning_machine_credential_id;
    vm.catalogItemModel.retirement_network_credential_id = vm.catalogItemModel.provisioning_network_credential_id;
    vm.retirement_cloud_type = vm.provisioning_cloud_type;
    vm._retirement_cloud_type = vm.provisioning_cloud_type;
    vm.catalogItemModel.retirement_cloud_credential_id = vm.catalogItemModel.provisioning_cloud_credential_id;
    vm.catalogItemModel.retirement_playbook_ttl = vm.catalogItemModel.provisioning_playbook_ttl;
    vm.catalogItemModel.retirement_inventory = vm.catalogItemModel.provisioning_inventory;
    vm.catalogItemModel.retirement_become_enabled = vm.catalogItemModel.provisioning_become_enabled;
    vm.catalogItemModel.retirement_verbosity = vm.catalogItemModel.provisioning_verbosity;
    vm.catalogItemModel.retirement_key = '';
    vm.catalogItemModel.retirement_value = '';
    vm.catalogItemModel.retirement_variables = angular.copy(vm.catalogItemModel.provisioning_variables);
    getRemoveResourcesTypes();
    $scope.checkFormPristine();
  }

  var closeConfirmationModal = function() {
    angular.element('#confirmationModal').modal("hide");
  }

  $scope.dialogNameValidation = function() {
    miqService.miqFlashClear();
    $scope.angularForm.$setValidity("unchanged", true);

    if (vm.dialogs.filter(function(e) { return e.label == vm.catalogItemModel.provisioning_dialog_name; }).length > 0) {
      miqService.miqFlash("error", "Dialog name already exists");
      $scope.angularForm.$setValidity("unchanged", false);
    }
  };

  init();
}]);

// Javascript function to be called from confirmation modal outside of Angular controller.
function cancelOrCopyProvisioning(buttonType) {
  var scope = angular.element("#form_div").scope();
  scope.$apply(function() {
    if (buttonType == "cancel")
      scope.cancelCopyProvisioning();
    else
      scope.copyProvisioning();
  });
}
