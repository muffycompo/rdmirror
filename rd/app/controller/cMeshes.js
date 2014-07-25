Ext.define('Rd.controller.cMeshes', {
    extend: 'Ext.app.Controller',
    actionIndex: function(){

        var me      = this;
        var desktop = this.application.getController('cDesktop');
        var win     = desktop.getWindow('meshWin');
        if(!win){
            win = desktop.createWindow({
                id      : 'meshWin',
                //title   : 'MESHdesk overview',
                btnText : i18n('sMESHdesk_overview'),
                width   : 800,
                height  : 400,
                iconCls : 'mesh',
                glyph   : Rd.config.icnMesh,
                animCollapse:false,
                border  :false,
                constrainHeader:true,
                layout  : 'border',
                stateful: true,
                stateId : 'meshWin',
                items: [
                    {
                        region  : 'north',
                        xtype   : 'pnlBanner',
                        heading : i18n('sMESHdesk_overview'),
                        image   : 'resources/images/48x48/mesh.png'
                    },
                    {
                        region  : 'center',
                        layout  : 'fit',
                        xtype   : 'gridMeshes',
                        margins : '0 0 0 0',
                        border  : true
                    }
                ]
            });
        }
        desktop.restoreWindow(win);    
        return win;
    },

    views:  [
        'components.pnlBanner',     'meshes.gridMeshes',        'meshes.winMeshAddWizard', 'meshes.winMeshEdit',
        'meshes.gridMeshEntries',   'meshes.winMeshAddEntry',   'meshes.cmbEncryptionOptions',
        'meshes.winMeshEditEntry',  'meshes.pnlMeshSettings',   'meshes.gridMeshExits',
        'meshes.winMeshAddExit',    'meshes.cmbMeshEntryPoints','meshes.winMeshEditExit',
        'meshes.pnlNodeCommonSettings', 'meshes.gridNodes',     'meshes.winMeshAddNode',
        'meshes.cmbHardwareOptions', 'meshes.cmbStaticEntries', 'meshes.cmbStaticExits',
        'components.winNote',       'components.winNoteAdd',    'meshes.winMeshEditNode',
        'meshes.winMeshView',       'meshes.gridMeshViewEntries', 'meshes.gridMeshViewNodes',
		'meshes.pnlMeshViewNodes'
    ],
    stores      : ['sMeshes',   'sAccessProvidersTree', 'sMeshEntries', 'sMeshExits', 'sMeshEntryPoints',
        'sNodes'//,   'sMeshViewEntries', 'sMeshViewNodes'
    ],
    models      : ['mMesh',     'mAccessProviderTree',  'mMeshEntry'  ,  'mMeshExit', 'mMeshEntryPoint',  
        'mNode'//,    'mMeshViewEntry', 'mMeshViewNode'
    ],
    selectedRecord: null,
    config      : {
        urlAdd:             '/cake2/rd_cake/meshes/add.json',
        urlEdit:            '/cake2/rd_cake/meshes/edit.json',
        urlDelete:          '/cake2/rd_cake/meshes/delete.json',
        urlApChildCheck:    '/cake2/rd_cake/access_providers/child_check.json',
        urlAddEntry:        '/cake2/rd_cake/meshes/mesh_entry_add.json',
        urlViewEntry:       '/cake2/rd_cake/meshes/mesh_entry_view.json',
        urlEditEntry:       '/cake2/rd_cake/meshes/mesh_entry_edit.json',
        urlViewMeshSettings:'/cake2/rd_cake/meshes/mesh_settings_view.json',
        urlEditMeshSettings:'/cake2/rd_cake/meshes/mesh_settings_edit.json',
        urlAddExit:         '/cake2/rd_cake/meshes/mesh_exit_add.json',
        urlViewExit:        '/cake2/rd_cake/meshes/mesh_exit_view.json',
        urlEditExit:        '/cake2/rd_cake/meshes/mesh_exit_edit.json',
        urlViewNodeCommonSettings:'/cake2/rd_cake/meshes/node_common_settings_view.json',
        urlEditNodeCommonSettings:'/cake2/rd_cake/meshes/node_common_settings_edit.json',
        urlAddNode:         '/cake2/rd_cake/meshes/mesh_node_add.json',
        urlViewNode:        '/cake2/rd_cake/meshes/mesh_node_view.json',
        urlEditNode:        '/cake2/rd_cake/meshes/mesh_node_edit.json',
        urlNoteAdd:         '/cake2/rd_cake/meshes/note_add.json',
    },
    refs: [
        {  ref: 'grid',         selector: 'gridMeshes'},
        {  ref: 'editEntryWin', selector: 'winMeshEditEntry'},
        {  ref: 'editExitWin',  selector: 'winMeshEditExit'}      
    ],
    init: function() {
        var me = this;
        if (me.inited) {
            return;
        }
        me.inited = true;

        me.getStore('sMeshes').addListener('load',me.onStoreMeshesLoaded, me);
        me.control({
            '#meshWin'    : {
                beforeshow:      me.winClose,
                destroy   :      me.winClose
            },
            'gridMeshes #reload': {
                click:      me.reload
            },
            'gridMeshes #reload menuitem[group=refresh]'   : {
                click:      me.reloadOptionClick
            },  
            'gridMeshes #add'   : {
                click:      me.add
            },
            'gridMeshes #delete'   : {
                click:      me.del
            },
            'gridMeshes #edit'   : {
                click:      me.edit
            },
            'gridMeshes #view'   : {
                click:      me.view
            },
            'gridMeshes #note'   : {
                click:      me.note
            },
            'gridNote[noteForGrid=meshes] #reload' : {
                click:  me.noteReload
            },
            'gridNote[noteForGrid=meshes] #add' : {
                click:  me.noteAdd
            },
            'gridNote[noteForGrid=meshes] #delete' : {
                click:  me.noteDelete
            },
            'gridNote[noteForGrid=meshes]' : {
                itemclick: me.gridNoteClick
            },
            'winNoteAdd[noteForGrid=meshes] #btnTreeNext' : {
                click:  me.btnNoteTreeNext
            },
            'winNoteAdd[noteForGrid=meshes] #btnNoteAddPrev'  : {   
                click: me.btnNoteAddPrev
            },
            'winNoteAdd[noteForGrid=meshes] #btnNoteAddNext'  : {   
                click: me.btnNoteAddNext
            },
            'winMeshAddWizard #btnTreeNext' : {
                click:  me.btnTreeNext
            },
            'winMeshAddWizard #btnDataPrev' : {
                click:  me.btnDataPrev
            },
            'winMeshAddWizard #btnDataNext' : {
                click:  me.btnDataNext
            },
            'gridMeshEntries #reload': {
                click:  me.reloadEntry
            },
            'gridMeshEntries #add': {
                click:  me.addEntry
            },
            'gridMeshEntries #edit': {
                click:  me.editEntry
            },
            'winMeshAddEntry cmbEncryptionOptions': {
                change: me.cmbEncryptionChange
            },
            'winMeshAddEntry #save': {
                click: me.btnAddEntrySave
            },
            'gridMeshEntries #delete': {
                click: me.delEntry
            },
            'winMeshEditEntry': {
                beforeshow:      me.loadEntry
            },
             'winMeshEditEntry cmbEncryptionOptions': {
                change: me.cmbEncryptionChange
            },
            'winMeshEditEntry #save': {
                click: me.btnEditEntrySave
            },
            'winMeshEdit #tabMeshSettings' : {
                activate:      me.frmMeshSettingsLoad
            },
            'pnlMeshSettings #save': {
                click:  me.btnMeshSettingsSave
            },
            'gridMeshExits #reload': {
                click:  me.reloadExit
            },
            'gridMeshExits #add': {
                click:  me.addExit
            },
            'winMeshAddExit #btnTypeNext' : {
                click:  me.btnExitTypeNext
            },
            'winMeshAddExit #btnDataPrev' : {
                click:  me.btnExitDataPrev
            },
            'winMeshAddExit #save' : {
                click:  me.btnAddExitSave
            },
            'gridMeshExits #delete': {
                click: me.delExit
            },
            'gridMeshExits #edit': {
                click:  me.editExit
            },
            'winMeshEditExit': {
                beforeshow:      me.loadExit
            },
            'winMeshEditExit #save': {
                click: me.btnEditExitSave
            },//Common node settings
            'winMeshEdit #tabNodeCommonSettings' : {
                activate:      me.frmNodeCommonSettingsLoad
            },
            'pnlNodeCommonSettings #save': {
                click:  me.btnNodeCommonSettingsSave
            },
            //Here nodes start
            'gridNodes #reload': {
                click:  me.reloadNodes
            },
            'gridNodes #add': {
                click:  me.addNode
            },
            'winMeshAddNode #save' : {
                click:  me.btnAddNodeSave
            },
            'gridNodes #delete': {
                click: me.delNode
            },
            'gridNodes #edit': {
                click:  me.editNode
            },
            'winMeshEditNode': {
                beforeshow:      me.loadNode
            },
            'winMeshEditNode #save': {
                click: me.btnEditNodeSave
            },
            //==== MESHdesk View related ====
            'winMeshView gridMeshViewEntries #reload' : {
                click: me.reloadViewEntry
            },
            'winMeshView gridMeshViewEntries button' : {
                toggle: me.viewEntryTimeToggle
            },
            'winMeshView gridMeshViewNodes #reload' : {
                click: me.reloadViewNode
            },
            'winMeshView gridMeshViewNodes button' : {
                toggle: me.viewNodeTimeToggle
            },
            'winMeshView #tabMeshViewEntries': {
                activate:       me.tabMeshViewEntriesActivate
            },
            'winMeshView #tabMeshViewNodes': {
                activate:       me.tabMeshViewNodesActivate
            },
            'winMeshView gridMeshViewEntries #reload menuitem[group=refresh]'   : {
                click:      function(menu){
                    var me = this;
                    console.log("Reload every entries");
                    me.autoRefresh(menu,'entries');
                }
            },
            'winMeshView gridMeshViewNodes #reload menuitem[group=refresh]'   : {
                click:      function(menu){
                    console.log("Reload every nodes");
                    me.autoRefresh(menu,'nodes');
                }
            },
            'winMeshView': {
                beforeshow:      me.winViewClose,
                destroy   :      me.winViewClose
            },
			'winMeshView #tabMeshViewNodeToNode':	{
				afterlayout:		function(panel){
/*
					console.log("Thing was layouted ;-)")
					var i = 'n_t_n_'+panel.meshId;
					console.log(panel.meshId);
//------------
var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

  var json = [
	// first node
    {
        id: "graphnode1",
        name: "A graph node (#1)",
		
        data: {
            $color: "#00FF00",
            $type: "circle",
            $dim: 10,
			'attr': 'once'
        },
		adjacencies: [
			"graphnode2",
			{
				nodeTo: "graphnode3",
				data: {
					"$color"	: "green",
					"$lineWidth": 6,
					"$alpha"	: 0.2
				}
			},
			"graphnode3",
			{
				nodeTo: "graphnode2",
				data: {
					"$color"	: "blue",
					"$lineWidth": 6,
					"$alpha"	: 0.7
				}
			}
		]
    },
    // second node
    {
        data: {
            $color: "#00FFFF",
            $type: "triangle",
            $dim: 10,
			'attr': 'twice'
        },
        id: "graphnode2",
        name: "Another graph node (#2)"
    },
    // third node
    {
        data: {
            $color: "#0000FF",
            $type: "square",
            $dim: 10,
			'attr': 'three times'
        },
        id: "graphnode3",
        name: "And another (#3)"
    }
];

  // init ForceDirected
  var fd = new $jit.ForceDirected({
    //id of the visualization container
    injectInto: i,
    //Enable zooming and panning
    //by scrolling and DnD
    Navigation: {
      enable: true,
      //Enable panning events only if we're dragging the empty
      //canvas (and not a node).
      panning: 'avoid nodes',
      zooming: 10 //zoom speed. higher is more sensible
    },
    // Change node and edge styles such as
    // color and width.
    // These properties are also set per node
    // with dollar prefixed data-properties in the
    // JSON structure.
    Node: {
      overridable: true
    },
    Edge: {
      overridable: true,
      color: 'red',
      lineWidth: 0.4
    },
    //Native canvas text styling
    Label: {
      type: labelType, //Native or HTML
      size: 20,
      style: 'bold'
    },
    //Add Tips
    Tips: {
      enable: true,
      onShow: function(tip, node) {
        //count connections
        var count = 0;
		console.log("Show tip pappie");
        node.eachAdjacency(function() { count++; });
        //display node info in tooltip
        tip.innerHTML = "<div class=\"divTip\"><div class=\"tip-title\">" + node.data.attr + "</div>"
          + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div></div>";
      }
    },
    // Add node events
    Events: {
      enable: true,
      type: 'Native',
      //Change cursor style when hovering a node
      onMouseEnter: function() {
        fd.canvas.getElement().style.cursor = 'move';
      },
      onMouseLeave: function() {
        fd.canvas.getElement().style.cursor = '';
      },
      //Update node positions when dragged
      onDragMove: function(node, eventInfo, e) {
          var pos = eventInfo.getPos();
          node.pos.setc(pos.x, pos.y);
          fd.plot();
      },
      //Implement the same handler for touchscreens
      onTouchMove: function(node, eventInfo, e) {
        $jit.util.event.stop(e); //stop default touchmove event
        this.onDragMove(node, eventInfo, e);
      },
      //Add also a click handler to nodes
      onClick: function(node) {
          if(!node) return;
          console.log(node);
          node.data["$color"] = "#FF0000";
          fd.plot();
      }
    },
    //Number of iterations for the FD algorithm
    iterations: 200,
    //Edge length
    levelDistance: 130,
    // Add text to the labels. This method is only triggered
    // on label creation and only for DOM labels (not native canvas ones).
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      var style = domElement.style;
      style.fontSize = "0.8em";
      style.color = "#ddd";
    },
  });

 fd.loadJSON(json);
  // compute positions incrementally and animate.
  fd.computeIncremental({
    iter: 40,
    property: 'end',
    onStep: function(perc){
      console.log(perc + '% loaded...');
    },
    onComplete: function(){
      console.log('done');
      fd.animate({
        modes: ['linear'],
        transition: $jit.Trans.Elastic.easeOut,
        duration: 2500
      });
    }
  });

*/
//--------------


				}
			}
        });
    },
    winClose:   function(){
        var me = this;
        if(me.autoReload != undefined){
            clearInterval(me.autoReload);   //Always clear
        }
    },
    reload: function(){
        var me =this;
        me.getGrid().getSelectionModel().deselectAll(true);
        me.getGrid().getStore().load();
    },
    reloadOptionClick: function(menu_item){
        var me      = this;
        var n       = menu_item.getItemId();
        var b       = menu_item.up('button'); 
        var interval= 30000; //default
        clearInterval(me.autoReload);   //Always clear
        b.setIconCls('b-reload_time');
        b.setGlyph(Rd.config.icnTime);

        if(n == 'mnuRefreshCancel'){
            b.setGlyph(Rd.config.icnReload);
            b.setIconCls('b-reload');
            return;
        }
        
        if(n == 'mnuRefresh1m'){
           interval = 60000
        }

        if(n == 'mnuRefresh5m'){
           interval = 360000
        }
        me.autoReload = setInterval(function(){        
            me.reload();
        },  interval);  
    },
    onStoreMeshesLoaded: function() {
        var me      = this;
        var count   = me.getStore('sMeshes').getTotalCount();
        me.getGrid().down('#count').update({count: count});
    },
    add: function(button){
        
        var me = this;
        //We need to do a check to determine if this user (be it admin or acess provider has the ability to add to children)
        //admin/root will always have, an AP must be checked if it is the parent to some sub-providers. If not we will 
        //simply show the nas connection typer selection 
        //if it does have, we will show the tree to select an access provider.
        Ext.Ajax.request({
            url: me.urlApChildCheck,
            method: 'GET',
            success: function(response){
                var jsonData    = Ext.JSON.decode(response.responseText);
                if(jsonData.success){
                        
                    if(jsonData.items.tree == true){
                        if(!me.application.runAction('cDesktop','AlreadyExist','winMeshAddWizardId')){
                            var w = Ext.widget('winMeshAddWizard',{id:'winMeshAddWizardId'});
                            me.application.runAction('cDesktop','Add',w);         
                        }
                    }else{
                        if(!me.application.runAction('cDesktop','AlreadyExist','winMeshAddWizardId')){
                            var w = Ext.widget('winMeshAddWizard',
                                {id:'winMeshAddWizardId',startScreen: 'scrnData',user_id:'0',owner: i18n('sLogged_in_user'), no_tree: true}
                            );
                            me.application.runAction('cDesktop','Add',w);         
                        }
                    }
                }   
            },
            scope: me
        });

    },
    btnTreeNext: function(button){
        var me = this;
        var tree = button.up('treepanel');
        //Get selection:
        var sr = tree.getSelectionModel().getLastSelected();
        if(sr){    
            var win = button.up('winMeshAddWizard');
            win.down('#owner').setValue(sr.get('username'));
            win.down('#user_id').setValue(sr.getId());
            win.getLayout().setActiveItem('scrnData');
        }else{
            Ext.ux.Toaster.msg(
                        i18n('sSelect_an_owner'),
                        i18n('sFirst_select_an_Access_Provider_who_will_be_the_owner'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }
    },
    btnDataPrev:  function(button){
        var me      = this;
        var win     = button.up('winMeshAddWizard');
        win.getLayout().setActiveItem('scrnApTree');
    },
    btnDataNext:  function(button){
        var me      = this;
        var win     = button.up('window');
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlAdd,
            success: function(form, action) {
                win.close();
                me.getStore('sMeshes').load();
                Ext.ux.Toaster.msg(
                    i18n('sNew_item_created'),
                    i18n('sItem_created_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    view: function(button){
        var me      = this;   
        //Find out if there was something selected
        var selCount = me.getGrid().getSelectionModel().getCount();
        if(selCount == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            if(selCount > 1){
                Ext.ux.Toaster.msg(
                        i18n('sLimit_the_selection'),
                        i18n('sSelection_limited_to_one'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
                );
            }else{
                var sr      = me.getGrid().getSelectionModel().getLastSelected();
                var id      = 'winMeshView'+sr.getId();
                var name    = sr.get('name');   
                if(!me.application.runAction('cDesktop','AlreadyExist',id)){
                    var w = Ext.widget('winMeshView',{id:id, name:name, stateId:id,title: 'MESHdesk view '+name, itemId: sr.getId()});
                    me.application.runAction('cDesktop','Add',w);      
                }
            }
        }
    },
    edit: function(button){
        var me      = this;   
        //Find out if there was something selected
        var selCount = me.getGrid().getSelectionModel().getCount();
        if(selCount == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            if(selCount > 1){
                Ext.ux.Toaster.msg(
                        i18n('sLimit_the_selection'),
                        i18n('sSelection_limited_to_one'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
                );
            }else{
                var sr      = me.getGrid().getSelectionModel().getLastSelected();
                var id      = 'winMeshEdit'+sr.getId();
                var name    = sr.get('name');   
                if(!me.application.runAction('cDesktop','AlreadyExist',id)){
                    var w = Ext.widget('winMeshEdit',{id:id, name:name, stateId:id,title: 'MESHdesk edit '+name, itemId: sr.getId()});
                    me.application.runAction('cDesktop','Add',w);      
                }
            }
        }
    },
    del:   function(){
        var me      = this;     
        //Find out if there was something selected
        if(me.getGrid().getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item_to_delete'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            Ext.MessageBox.confirm(i18n('sConfirm'), i18n('sAre_you_sure_you_want_to_do_that_qm'), function(val){
                if(val== 'yes'){

                    var selected    = me.getGrid().getSelectionModel().getSelection();
                    var list        = [];
                    Ext.Array.forEach(selected,function(item){
                        var id = item.getId();
                        Ext.Array.push(list,{'id' : id});
                    });

                    Ext.Ajax.request({
                        url: me.urlDelete,
                        method: 'POST',          
                        jsonData: list,
                        success: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sItem_deleted'),
                                i18n('sItem_deleted_fine'),
                                Ext.ux.Constants.clsInfo,
                                Ext.ux.Constants.msgInfo
                            );
                            me.reload(); //Reload from server
                        },                                    
                        failure: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sProblems_deleting_item'),
                                batch.proxy.getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                            me.reload(); //Reload from server
                        }
                    });
                }
            });
        }
    },
    reloadEntry: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var entGrid = win.down("gridMeshEntries");
        entGrid.getStore().reload();
    },
    addEntry: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var store   = win.down("gridMeshEntries").getStore();
        if(!me.application.runAction('cDesktop','AlreadyExist','winMeshAddEntryId')){
            var w = Ext.widget('winMeshAddEntry',
            {
                id          :'winMeshAddEntryId',
                store       : store,
                meshId      : win.getItemId()
            });
            me.application.runAction('cDesktop','Add',w);         
        }
    },
    cmbEncryptionChange: function(cmb){
        var me      = this;
        var form    = cmb.up('form');
        var key     = form.down('#key');
        var srv     = form.down('#auth_server');
        var scrt    = form.down('#auth_secret'); 
        var val     = cmb.getValue();
        if(val == 'none'){
            key.setVisible(false);
            key.setDisabled(true); 
            srv.setVisible(false);
            srv.setDisabled(true);
            scrt.setVisible(false);
            scrt.setDisabled(true);  
        }

        if((val == 'wep')|(val == 'psk')|(val =='psk2')){
            key.setVisible(true);
            key.setDisabled(false); 
            srv.setVisible(false);
            srv.setDisabled(true);
            scrt.setVisible(false);
            scrt.setDisabled(true);  
        }

        if((val == 'wpa')|(val == 'wpa2')){
            key.setVisible(false);
            key.setDisabled(true); 
            srv.setVisible(true);
            srv.setDisabled(false);
            scrt.setVisible(true);
            scrt.setDisabled(false);  
        }

    },
    btnAddEntrySave:  function(button){
        var me      = this;
        var win     = button.up("winMeshAddEntry");
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlAddEntry,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sNew_mesh_entry_point_added'),
                    i18n('sNew_mesh_enty_point_created_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    editEntry: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var store   = win.down("gridMeshEntries").getStore();

        if(win.down("gridMeshEntries").getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            var sr      = win.down("gridMeshEntries").getSelectionModel().getLastSelected();
            var id      = sr.getId();
            if(!me.application.runAction('cDesktop','AlreadyExist','winMeshEditEntryId')){
                var w = Ext.widget('winMeshEditEntry',
                {
                    id          :'winMeshEditEntryId',
                    store       : store,
                    entryId     : id
                });
                me.application.runAction('cDesktop','Add',w);         
            }else{
                var w       = me.getEditEntryWin();
                w.entryId   = id; 
                me.loadEntry(w)
            } 
        }     
    },
    loadEntry: function(win){
        var me      = this; 
        var form    = win.down('form');
        var entryId = win.entryId;
        form.load({url:me.urlViewEntry, method:'GET',params:{entry_id:entryId}});
    },
    btnEditEntrySave:  function(button){
        var me      = this;
        var win     = button.up("winMeshEditEntry");
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlEditEntry,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sItem_updated'),
                    i18n('sItem_updated_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    delEntry:   function(btn){
        var me      = this;
        var win     = btn.up("window");
        var grid    = win.down("gridMeshEntries");
    
        //Find out if there was something selected
        if(grid.getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item_to_delete'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            Ext.MessageBox.confirm(i18n('sConfirm'), i18n('sAre_you_sure_you_want_to_do_that_qm'), function(val){
                if(val== 'yes'){
                    grid.getStore().remove(grid.getSelectionModel().getSelection());
                    grid.getStore().sync({
                        success: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sItem_deleted'),
                                i18n('sItem_deleted_fine'),
                                Ext.ux.Constants.clsInfo,
                                Ext.ux.Constants.msgInfo
                            );  
                        },
                        failure: function(batch,options,c,d){
                            Ext.ux.Toaster.msg(
                                i18n('sProblems_deleting_item'),
                                batch.proxy.getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                            grid.getStore().load(); //Reload from server since the sync was not good
                        }
                    });
                }
            });
        }
    },
    frmMeshSettingsLoad: function(tab){
        var me      = this;
        var form    = tab.down('form');
        var meshId  = tab.meshId;
        form.load({url:me.urlViewMeshSettings, method:'GET',params:{mesh_id:meshId}});
    },
    btnMeshSettingsSave: function(button){
        var me      = this;
        var form    = button.up('form');
        var tab     = button.up('#tabMeshSettings');
        var meshId  = tab.meshId;
        form.submit({
            clientValidation    : true,
            url                 : me.urlEditMeshSettings,
            params              : {mesh_id: meshId},
            success: function(form, action) {
                Ext.ux.Toaster.msg(
                    i18n('sItem_updated'),
                    i18n('sItem_updated_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    reloadExit: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var exit    = win.down("gridMeshExits");
        exit.getStore().reload();
    },
    addExit: function(button){
        var me      = this;

        var win             = button.up("winMeshEdit");

        //If there are NO entry points defined; we will NOT pop up this window.
        var entries_count   = win.down("gridMeshEntries").getStore().count();
        if(entries_count == 0){
            Ext.ux.Toaster.msg(
                i18n('sNo_entry_points_defined'),
                i18n('sDefine_some_entry_points_first'),
                Ext.ux.Constants.clsWarn,
                Ext.ux.Constants.msgWarn
            );
            return;
        }
        
        //Entry points present; continue 
        var store   = win.down("gridMeshExits").getStore();
        if(!me.application.runAction('cDesktop','AlreadyExist','winMeshAddExitId')){
            var w = Ext.widget('winMeshAddExit',
            {
                id          :'winMeshAddExitId',
                store       : store,
                meshId      : win.getItemId()
            });
            me.application.runAction('cDesktop','Add',w);         
        }
    },
    btnExitTypeNext: function(button){
        var me      = this;
        var win     = button.up('winMeshAddExit');
        var type    = win.down('radiogroup').getValue().exit_type;
        var vlan    = win.down('#vlan');
        var tab_capt= win.down('#tabCaptivePortal');
        var sel_type= win.down('#type');
        sel_type.setValue(type);
 
        if(type == 'tagged_bridge'){
            vlan.setVisible(true);
            vlan.setDisabled(false);
        }else{
            vlan.setVisible(false);
            vlan.setDisabled(true);
        }

        if(type == 'captive_portal'){
            tab_capt.setDisabled(false);
        }else{
            tab_capt.setDisabled(true); 
        }
        win.getLayout().setActiveItem('scrnData');
    },
    btnExitDataPrev: function(button){
        var me      = this;
        var win     = button.up('winMeshAddExit');
        win.getLayout().setActiveItem('scrnType');
    },
    btnAddExitSave: function(button){
        var me      = this;
        var win     = button.up("winMeshAddExit");
        var form    = win.down('#scrnData');
        form.submit({
            clientValidation: true,
            url: me.urlAddExit,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sItem_added'),
                    i18n('sItem_added_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    delExit:   function(btn){
        var me      = this;
        var win     = btn.up("window");
        var grid    = win.down("gridMeshExits");
    
        //Find out if there was something selected
        if(grid.getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item_to_delete'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            Ext.MessageBox.confirm(i18n('sConfirm'), i18n('sAre_you_sure_you_want_to_do_that_qm'), function(val){
                if(val== 'yes'){
                    grid.getStore().remove(grid.getSelectionModel().getSelection());
                    grid.getStore().sync({
                        success: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sItem_deleted'),
                                i18n('sItem_deleted_fine'),
                                Ext.ux.Constants.clsInfo,
                                Ext.ux.Constants.msgInfo
                            );  
                        },
                        failure: function(batch,options,c,d){
                            Ext.ux.Toaster.msg(
                                i18n('sProblems_deleting_item'),
                                batch.proxy.getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                            grid.getStore().load(); //Reload from server since the sync was not good
                        }
                    });
                }
            });
        }
    },
    editExit: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var store   = win.down("gridMeshExits").getStore();

        if(win.down("gridMeshExits").getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            var sr      = win.down("gridMeshExits").getSelectionModel().getLastSelected();
            var id      = sr.getId();
            var meshId  = sr.get('mesh_id');
            var type    = sr.get('type');
            if(!me.application.runAction('cDesktop','AlreadyExist','winMeshEditExitId')){
                var w = Ext.widget('winMeshEditExit',
                {
                    id          :'winMeshEditExitId',
                    store       : store,
                    exitId      : id,
                    meshId      : meshId,
                    type        : type
                });
                me.application.runAction('cDesktop','Add',w);         
            }else{
                var w       = me.getEditExitWin();
                var vlan    = w.down('#vlan');
                var tab_capt= w.down('#tabCaptivePortal');
                w.exitId    = id;
                w.meshId    = meshId;

                if(type == 'tagged_bridge'){
                    vlan.setVisible(true);
                    vlan.setDisabled(false);
                }else{
                    vlan.setVisible(false);
                    vlan.setDisabled(true);
                }

                if(type == 'captive_portal'){
                    tab_capt.setDisabled(false);
                }else{
                    tab_capt.setDisabled(true); 
                }
                me.loadExit(w)
            } 
        }     
    },
    loadExit: function(win){
        var me      = this; 
        var form    = win.down('form');
        var exitId = win.exitId;
        form.load({
            url         :me.urlViewExit, 
            method      :'GET',
            params      :{exit_id:exitId},
            success     : function(a,b,c){
                var t     = form.down("#type");
                var t_val = t.getValue();
                var vlan  = form.down('#vlan');
                if(t_val == 'tagged_bridge'){
                    vlan.setVisible(true);
                    vlan.setDisabled(false);
                }else{
                    vlan.setVisible(false);
                    vlan.setDisabled(true);
                }
            }
        });
    },
    btnEditExitSave:  function(button){
        var me      = this;
        var win     = button.up("winMeshEditExit");
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlEditExit,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sItem_updated'),
                    i18n('sItem_updated_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },//Common node settings
    frmNodeCommonSettingsLoad: function(tab){
        var me      = this;
        var form    = tab.down('form');
        var meshId  = tab.meshId;
        form.load({url:me.urlViewNodeCommonSettings, method:'GET',params:{mesh_id:meshId}});
    },
    btnNodeCommonSettingsSave: function(button){
        var me      = this;
        var form    = button.up('form');
        var tab     = button.up('#tabNodeCommonSettings');
        var meshId  = tab.meshId;
        form.submit({
            clientValidation    : true,
            url                 : me.urlEditNodeCommonSettings,
            params              : {mesh_id: meshId},
            success: function(form, action) {
                Ext.ux.Toaster.msg(
                    i18n('sItem_updated'),
                    i18n('sItem_updated_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },//Nodes related
    reloadNodes: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var nodes   = win.down("gridNodes");
        nodes.getStore().reload();
    },
    addNode: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        
        //Entry points present; continue 
        var store   	= win.down("gridNodes").getStore();
		var hide_power 	= win.down("pnlNodeCommonSettings #all_power").getValue();
        if(!me.application.runAction('cDesktop','AlreadyExist','winMeshAddNodeId')){
            var w = Ext.widget('winMeshAddNode',
            {
                id          :'winMeshAddNodeId',
                store       : store,
                meshId      : win.getItemId(),
				hidePower	: hide_power	
            });
            me.application.runAction('cDesktop','Add',w);         
        }
    },
    btnAddNodeSave: function(button){
        var me      = this;
        var win     = button.up("winMeshAddNode");
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlAddNode,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sItem_added'),
                    i18n('sItem_added_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    delNode:   function(btn){
        var me      = this;
        var win     = btn.up("window");
        var grid    = win.down("gridNodes");
    
        //Find out if there was something selected
        if(grid.getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item_to_delete'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            Ext.MessageBox.confirm(i18n('sConfirm'), i18n('sAre_you_sure_you_want_to_do_that_qm'), function(val){
                if(val== 'yes'){
                    grid.getStore().remove(grid.getSelectionModel().getSelection());
                    grid.getStore().sync({
                        success: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sItem_deleted'),
                                i18n('sItem_deleted_fine'),
                                Ext.ux.Constants.clsInfo,
                                Ext.ux.Constants.msgInfo
                            );  
                        },
                        failure: function(batch,options,c,d){
                            Ext.ux.Toaster.msg(
                                i18n('sProblems_deleting_item'),
                                batch.proxy.getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                            grid.getStore().load(); //Reload from server since the sync was not good
                        }
                    });
                }
            });
        }
    },
    editNode: function(button){
        var me      = this;
        var win     = button.up("winMeshEdit");
        var store   = win.down("gridNodes").getStore();
        if(win.down("gridNodes").getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            var sr      = win.down("gridNodes").getSelectionModel().getLastSelected();
            var id      = sr.getId();
            var meshId  = sr.get('mesh_id');
			//Determine if we can show a power bar or not.
			var hide_power = win.down("pnlNodeCommonSettings #all_power").getValue();
            if(!me.application.runAction('cDesktop','AlreadyExist','winMeshEditNodeId')){
                var w = Ext.widget('winMeshEditNode',
                {
                    id          :'winMeshEditNodeId',
                    store       : store,
                    nodeId      : id,
                    meshId      : meshId,
					hidePower	: hide_power
                });
                me.application.runAction('cDesktop','Add',w);         
            }
        }
    },
    loadNode: function(win){
        var me      = this; 
        var form    = win.down('form');
        var nodeId  = win.nodeId;
        form.load({url:me.urlViewNode, method:'GET',params:{node_id:nodeId}});
    },
    btnEditNodeSave:  function(button){
        var me      = this;
        var win     = button.up("winMeshEditNode");
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlEditNode,
            success: function(form, action) {
                win.close();
                win.store.load();
                Ext.ux.Toaster.msg(
                    i18n('sItem_updated'),
                    i18n('sItem_updated_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    //Notes for MESHes
    note: function(button,format) {
        var me      = this;    
        //Find out if there was something selected
        var sel_count = me.getGrid().getSelectionModel().getCount();
        if(sel_count == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            if(sel_count > 1){
                Ext.ux.Toaster.msg(
                        i18n('sLimit_the_selection'),
                        i18n('sSelection_limited_to_one'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
                );
            }else{

                //Determine the selected record:
                var sr = me.getGrid().getSelectionModel().getLastSelected();
                
                if(!me.application.runAction('cDesktop','AlreadyExist','winNoteMeshes'+sr.getId())){
                    var w = Ext.widget('winNote',
                        {
                            id          : 'winNoteMeshes'+sr.getId(),
                            noteForId   : sr.getId(),
                            noteForGrid : 'meshes',
                            noteForName : sr.get('name')
                        });
                    me.application.runAction('cDesktop','Add',w);       
                }
            }    
        }
    },
    noteReload: function(button){
        var me      = this;
        var grid    = button.up('gridNote');
        grid.getStore().load();
    },
    noteAdd: function(button){
        var me      = this;
        var grid    = button.up('gridNote');

        //See how the wizard should be displayed:
        Ext.Ajax.request({
            url: me.urlApChildCheck,
            method: 'GET',
            success: function(response){
                var jsonData    = Ext.JSON.decode(response.responseText);
                if(jsonData.success){                      
                    if(jsonData.items.tree == true){
                        if(!me.application.runAction('cDesktop','AlreadyExist','winNoteMeshesAdd'+grid.noteForId)){
                            var w   = Ext.widget('winNoteAdd',
                            {
                                id          : 'winNoteMeshesAdd'+grid.noteForId,
                                noteForId   : grid.noteForId,
                                noteForGrid : grid.noteForGrid,
                                refreshGrid : grid
                            });
                            me.application.runAction('cDesktop','Add',w);       
                        }
                    }else{
                        if(!me.application.runAction('cDesktop','AlreadyExist','winNoteMeshesAdd'+grid.noteForId)){
                            var w   = Ext.widget('winNoteAdd',
                            {
                                id          : 'winNoteMeshesAdd'+grid.noteForId,
                                noteForId   : grid.noteForId,
                                noteForGrid : grid.noteForGrid,
                                refreshGrid : grid,
                                startScreen : 'scrnNote',
                                user_id     : '0',
                                owner       : i18n('sLogged_in_user'),
                                no_tree     : true
                            });
                            me.application.runAction('cDesktop','Add',w);       
                        }
                    }
                }   
            },
            scope: me
        });
    },
    gridNoteClick: function(item,record){
        var me = this;
        //Dynamically update the top toolbar
        grid    = item.up('gridNote');
        tb      = grid.down('toolbar[dock=top]');
        var del = record.get('delete');
        if(del == true){
            if(tb.down('#delete') != null){
                tb.down('#delete').setDisabled(false);
            }
        }else{
            if(tb.down('#delete') != null){
                tb.down('#delete').setDisabled(true);
            }
        }
    },
    btnNoteTreeNext: function(button){
        var me = this;
        var tree = button.up('treepanel');
        //Get selection:
        var sr = tree.getSelectionModel().getLastSelected();
        if(sr){    
            var win = button.up('winNoteAdd');
            win.down('#owner').setValue(sr.get('username'));
            win.down('#user_id').setValue(sr.getId());
            win.getLayout().setActiveItem('scrnNote');
        }else{
            Ext.ux.Toaster.msg(
                        i18n('sSelect_an_owner'),
                        i18n('sFirst_select_an_Access_Provider_who_will_be_the_owner'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }
    },
    btnNoteAddPrev: function(button){
        var me = this;
        var win = button.up('winNoteAdd');
        win.getLayout().setActiveItem('scrnApTree');
    },
    btnNoteAddNext: function(button){
        var me      = this;
        var win     = button.up('winNoteAdd');
        win.refreshGrid.getStore().load();
        var form    = win.down('form');
        form.submit({
            clientValidation: true,
            url: me.urlNoteAdd,
            params: {for_id : win.noteForId},
            success: function(form, action) {
                win.close();
                win.refreshGrid.getStore().load();
                me.reload();
                Ext.ux.Toaster.msg(
                    i18n('sNew_item_created'),
                    i18n('sItem_created_fine'),
                    Ext.ux.Constants.clsInfo,
                    Ext.ux.Constants.msgInfo
                );
            },
            failure: Ext.ux.formFail
        });
    },
    noteDelete: function(button){
        var me      = this;
        var grid    = button.up('gridNote');
        //Find out if there was something selected
        if(grid.getSelectionModel().getCount() == 0){
             Ext.ux.Toaster.msg(
                        i18n('sSelect_an_item'),
                        i18n('sFirst_select_an_item'),
                        Ext.ux.Constants.clsWarn,
                        Ext.ux.Constants.msgWarn
            );
        }else{
            Ext.MessageBox.confirm(i18n('sConfirm'), i18n('sAre_you_sure_you_want_to_do_that_qm'), function(val){
                if(val== 'yes'){
                    grid.getStore().remove(grid.getSelectionModel().getSelection());
                    grid.getStore().sync({
                        success: function(batch,options){
                            Ext.ux.Toaster.msg(
                                i18n('sItem_deleted'),
                                i18n('sItem_deleted_fine'),
                                Ext.ux.Constants.clsInfo,
                                Ext.ux.Constants.msgInfo
                            );
                            grid.getStore().load();   //Update the count
                            me.reload();   
                        },
                        failure: function(batch,options,c,d){
                            Ext.ux.Toaster.msg(
                                i18n('sProblems_deleting_item'),
                                batch.proxy.getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                            grid.getStore().load(); //Reload from server since the sync was not good
                        }
                    });
                }
            });
        }
    },
    //================= MESHdesk ViewStuff=================
    viewEntryTimeToggle: function(button,pressed){
        var me = this;
        if(pressed){
            me.reloadViewEntry(button);  
        }
    },
    reloadViewEntry: function(button){
        var me      = this;
        var win     = button.up("winMeshView");
        var entGrid = win.down("gridMeshViewEntries");
        var day     = entGrid.down('#day');
        var week    = entGrid.down('#week');
        var span    = 'hour';
        if(day.pressed){
            span='day';
        }
        if(week.pressed){
            span='week';
        }
        entGrid.getStore().getProxy().setExtraParam('timespan',span);
        entGrid.getStore().reload();
    },
    viewNodeTimeToggle: function(button,pressed){
        var me = this;
        if(pressed){
            me.reloadViewNode(button);  
        }
    },
    reloadViewNode: function(button){
        var me      = this;
        var win     = button.up("winMeshView");
        var entGrid = win.down("gridMeshViewNodes");
        var day     = entGrid.down('#day');
        var week    = entGrid.down('#week');
        var span    = 'hour';
        if(day.pressed){
            span='day';
        }
        if(week.pressed){
            span='week';
        }
        entGrid.getStore().getProxy().setExtraParam('timespan',span);
        entGrid.getStore().reload();
    },
    tabMeshViewNodesActivate: function(tab){
        var me = this;
        var b = tab.down('#reload');
        me.reloadViewNode(b);
    },
    tabMeshViewEntriesActivate: function(tab){
        var me = this;
        var b = tab.down('#reload');
        me.reloadViewEntry(b);
    },
    autoRefresh: function(menu_item,item){
        var me      = this;
        var n       = menu_item.getItemId();
        var b       = menu_item.up('button'); 
        var interval= 30000; //default
        clearInterval(me.autoRefresInterval);   //Always clear
        b.setIconCls('b-reload_time');
        b.setGlyph(Rd.config.icnTime);

        if(n == 'mnuRefreshCancel'){
            b.setGlyph(Rd.config.icnReload);
            b.setIconCls('b-reload');
            return;
        }
        
        if(n == 'mnuRefresh1m'){
           interval = 60000
        }

        if(n == 'mnuRefresh5m'){
           interval = 360000
        }
        me.autoRefresInterval = setInterval(function(){ 
            if(item == 'nodes'){
                me.reloadViewNode(b);
            } 

            if(item == 'entries'){
                me.reloadViewEntry(b);
            }       
        },  interval);  

    },
    winViewClose:   function(){
        var me = this;
        if(me.autoRefresInterval != undefined){
            clearInterval(me.autoRefresInterval);   //Always clear
        }
    }
});
