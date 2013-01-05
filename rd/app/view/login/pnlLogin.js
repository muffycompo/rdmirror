Ext.define('Rd.view.login.pnlLogin', {  
    extend:     'Ext.panel.Panel',
    border:     false,
    autoCreate: false,
    alias:      'widget.pnlLogin',
    layout:     'fit',
    requires:   ['Rd.view.components.compWallpaper'],
    url:        null,   //Placheholder for wallpaper URL     
    initComponent: function () {
        var me = this;
        //Wallpaper background
        me.items = [{'xtype' : 'compWallpaper','url' : me.url}];

        var l = Ext.create('Ext.form.ComboBox', {
            fieldLabel: i18n('sChoose_a_language'),
           // fieldLabel: i18n('sChoose a {k}',{k: 'Kitzimbers'}),
            labelSeparator: '',
            labelClsExtra: 'lblRd',
            labelWidth: 150,
            store: 'sLanguages',
            margin: '0 0 0 10',
            queryMode: 'local',
            valueField: 'id',
            displayField: 'text',
            typeAhead: true,
            mode: 'local',
            itemId: 'cmbLanguage',
            matchFieldWidth: true,
            listConfig : {
                getInnerTpl: function () {
                    return ' <div data-qtip="{country} : {language}">'+
                        '<div class="combo-wrapper">'+
                        '<div class="combo-country">{country}<img src="{icon_file}" /></div>'+
                        '<div class="combo-language"> {language}</div>'+
                        '</div>'+
                        '</div>';
                }
            }
        });
        me.bbar = [
            {
                xtype: 'container',
                width: 350,
                layout: 'fit',
                items:  l
            },
            '->',
            { xtype: 'button', text: i18n('sAbout'),       scale: 'large', cls: 'lblRd',iconCls: 'b-btn_info' }
        ];
        me.add(me.loginWindow());
       // me.loginWindow();
        me.callParent(arguments);
    },
    loginWindow: function(){
        var lw = Ext.create('Ext.window.Window',{
            itemId: 'winLogin',
            layout: 'fit',
            autoShow: true,
            closable: false,
            draggable: false,
            resizable: false,
            title: i18n('sAuthenticate_please'),
            icon: 'resources/images/16x16/lock.png',
            width: 300,
            height: 290,
            plain: true,
            border: true,
            items : [
                {
                    xtype: 'form',
                    border: false,
                    layout: 'anchor',
                    height: '100%',
                    bodyPadding: 20,
                    fieldDefaults: {
                        msgTarget: 'under',
                        labelAlign: 'top',
                        anchor: '100%',
                        labelSeparator: '',
                        labelClsExtra: 'lblRd'
                    },
                    defaultType: 'textfield',
                    items: [
                        {
                            itemId: 'inpUsername',
                            name : "username",
                            fieldLabel: i18n('sUsername'),
                            allowBlank:false,
                            blankText:  i18n('sEnter_username')
                        },
                        {
                            itemId: 'inpPassword',                            
                            name : "password",
                            fieldLabel: i18n('sPassword'),
                            inputType: 'password',
                            allowBlank:false,
                            blankText:  i18n('sEnter_password')
                        }
                    ],
                    dockedItems: [{
                        xtype: 'toolbar',
                        dock: 'bottom',
                        ui: 'footer',
                        padding: 0,
                        items: [ '->',
                            {
                                text: i18n('sOK'),
                                margin: '0 20 40 20',
                                action: 'ok',
                                type: 'submit',
                                formBind: true,
                                scale: 'large',
                                iconCls: 'b-btn_connect',
                                cls: 'lblRd'
                            }  
                        ]
                    }]
                }
            ] 
        });
    }
});


