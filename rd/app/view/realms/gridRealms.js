Ext.define('Rd.view.realms.gridRealms' ,{
    extend:'Ext.grid.Panel',
    alias : 'widget.gridRealms',
    store : 'sRealms',
    stateful: true,
    stateId: 'StateGridRealms',
    stateEvents:['groupclick','columnhide'],
    border: false,
    requires: [
        'Rd.view.components.ajaxToolbar'
    ],
    urlMenu: '/cake2/rd_cake/realms/menu_for_grid.json',
    columns: [
        {xtype: 'rownumberer'},
        { text: 'Name',     dataIndex: 'name',      tdCls: 'gridTree', flex: 1},
        { text: 'Creator',  dataIndex: 'creator',   tdCls: 'gridTree', flex: 1},
        { text: 'Phone',    dataIndex: 'phone',     tdCls: 'gridTree', flex: 1, hidden: true},
        { text: 'Fax',      dataIndex: 'fax',       tdCls: 'gridTree', flex: 1, hidden: true},
        { text: 'Cell',     dataIndex: 'cell',      tdCls: 'gridTree', flex: 1, hidden: true},
        { text: 'email',    dataIndex: 'email',     tdCls: 'gridTree', flex: 1, hidden: true},
        { text: 'Url',      dataIndex: 'url',       tdCls: 'gridTree', flex: 1, hidden: true},
        { 
            text:   'Available to sub-providers',
            flex: 1,  
            xtype:  'templatecolumn', 
            tpl:    new Ext.XTemplate(
                        "<tpl if='available_to_siblings == true'><div class=\"hasRight\">Yes</div></tpl>",
                        "<tpl if='available_to_siblings == false'><div class=\"noRight\">No</div></tpl>"
                    )
        }   
    ],
    bbar: [
        {   xtype: 'component', itemId: 'count',   tpl: 'Result count: {count}',   style: 'margin-right:5px', cls: 'lblYfi'  }
    ],
    initComponent: function(){
        var me  = this;
        me.tbar = Ext.create('Rd.view.components.ajaxToolbar',{'url': me.urlMenu});
        me.callParent(arguments);
    }
});
