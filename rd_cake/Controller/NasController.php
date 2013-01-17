<?php
App::uses('AppController', 'Controller');

class NasController extends AppController {


    public $name       = 'Nas';
    public $components = array('Aa','RequestHandler');
    protected $base    = "Access Providers/Controllers/Nas/";

    //List of parents and children (for APs)
    private $parents   = array();
    private $children  = array();

    protected $tmpDir  = 'csvexport';

//------------------------------------------------------------------------

    public function export_csv(){

        $this->autoRender   = false;

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }

        //Build query
        $user_id    = $user['id'];
        $c          = $this->_build_common_query($user);
        $q_r        = $this->Na->find('all',$c);

        //Create file
        $this->ensureTmp();     
        $tmpFilename    = TMP . $this->tmpDir . DS .  strtolower( Inflector::pluralize($this->modelClass) ) . '-' . date('Ymd-Hms') . '.csv';
        $fp             = fopen($tmpFilename, 'w');

        //Headings
        $heading_line   = array();
        if(isset($this->request->query['columns'])){
            $columns = json_decode($this->request->query['columns']);
            foreach($columns as $c){
                array_push($heading_line,$c->name);
            }
        }
        fputcsv($fp, $heading_line,';','"');

        //Results
        $this->User = ClassRegistry::init('User');
        foreach($q_r as $i){

            $columns    = array();
            $csv_line   = array();
            if(isset($this->request->query['columns'])){
                $columns = json_decode($this->request->query['columns']);
                foreach($columns as $c){
                    //Realms
                    $column_name = $c->name;
                    if($column_name == 'realms'){
                        $realms = '';
                        foreach($i['NaRealm'] as $nr){
                            if(!$this->_test_for_private_parent($nr['Realm'],$user)){
                                $realms = $realms.'['.$nr['Realm']['name'].']';
                            }
                        }
                        array_push($csv_line,$realms);
                    }elseif($column_name == 'tags'){
                        $tags   = '';
                        foreach($i['NaTag'] as $nr){
                            if(!$this->_test_for_private_parent($nr['Tag'],$user)){
                                $tags = $tags.'['.$nr['Tag']['name'].']';    
                            }
                        }
                        array_push($csv_line,$tags);
                    }elseif($column_name == 'notes'){
                        $notes   = '';
                        foreach($i['NaNote'] as $n){
                            if(!$this->_test_for_private_parent($n['Note'],$user)){
                                $notes = $notes.'['.$n['Note']['note'].']';    
                            }
                        }
                        array_push($csv_line,$notes);
                    }elseif($column_name =='owner'){
                        $owner_id       = $i['Na']['user_id'];
                        $owner_tree     = $this->_find_parents($owner_id);
                        array_push($csv_line,$owner_tree); 
                    }else{
                        array_push($csv_line,$i['Na']["$column_name"]);  
                    }
                }
                fputcsv($fp, $csv_line,';','"');
            }
        }

        //Return results
        fclose($fp);
        $data = file_get_contents( $tmpFilename );
        $this->cleanupTmp( $tmpFilename );
        $this->RequestHandler->respondAs('csv');
        $this->response->download( strtolower( Inflector::pluralize( $this->modelClass ) ) . '.csv' );
        $this->response->body($data);
    }

    //____ BASIC CRUD Realm Manager ________
    public function index(){
        //Display a list of realms with their owners
        //This will be dispalyed to the Administrator as well as Access Providers who has righs

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];

        $c = $this->_build_common_query($user);  

        //===== PAGING (MUST BE LAST) ======
        $limit  = 50;   //Defaults
        $page   = 1;
        $offset = 0;
        if(isset($this->request->query['limit'])){
            $limit  = $this->request->query['limit'];
            $page   = $this->request->query['page'];
            $offset = $this->request->query['start'];
        }

        $c_page             = $c;
        $c_page['page']     = $page;
        $c_page['limit']    = $limit;
        $c_page['offset']   = $offset;

        $total  = $this->Na->find('count',$c);       
        $q_r    = $this->Na->find('all',$c_page);

        $items = array();
        $this->User = ClassRegistry::init('User');

        foreach($q_r as $i){

            $realms     = array();
            //Realms
            foreach($i['NaRealm'] as $nr){
                if(!$this->_test_for_private_parent($nr['Realm'],$user)){
                    array_push($realms, 
                        array(
                            'id'                    => $nr['Realm']['id'],
                            'name'                  => $nr['Realm']['name'],
                            'available_to_siblings' => $nr['Realm']['available_to_siblings']
                        ));
                }
            } 

            //Create tags list
            $tags       = array();
            foreach($i['NaTag'] as $nr){
                if(!$this->_test_for_private_parent($nr['Tag'],$user)){
                    array_push($tags, 
                        array(
                            'id'                    => $nr['Tag']['id'],
                            'name'                  => $nr['Tag']['name'],
                            'available_to_siblings' => $nr['Tag']['available_to_siblings']
                    ));
                }
            }

            //Create notes flag
            $notes_flag  = false;
            foreach($i['NaNote'] as $nn){
                if(!$this->_test_for_private_parent($nn['Note'],$user)){
                    $notes_flag = true;
                    break;
                }
            }

            $owner_id       = $i['Na']['user_id'];
            $owner_tree     = $this->_find_parents($owner_id);
            $action_flags   = $this->_get_action_flags($owner_id,$user);
      
            array_push($items,array(
                'id'                    => $i['Na']['id'], 
                'nasname'               => $i['Na']['nasname'],
                'shortname'             => $i['Na']['shortname'],
                'owner'                 => $owner_tree, 
                'available_to_siblings' => $i['Na']['available_to_siblings'],
                'notes'                 => $notes_flag,
                'realms'                => $realms,
                'tags'                  => $tags,
                'connection_type'       => $i['Na']['connection_type'],
                'update'                => $action_flags['update'],
                'delete'                => $action_flags['delete'],
                'manage_tags'           => $action_flags['manage_tags']
            ));
        }

        //___ FINAL PART ___
        $this->set(array(
            'items' => $items,
            'success' => true,
            'totalCount' => $total,
            '_serialize' => array('items','success','totalCount')
        ));
    }

    public function add() {

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];

        //Get the creator's id
         if($this->request->data['user_id'] == '0'){ //This is the holder of the token - override '0'
            $this->request->data['user_id'] = $user_id;
        }

        //Make available to siblings check
        if(isset($this->request->data['available_to_siblings'])){
            $this->request->data['available_to_siblings'] = 1;
        }else{
            $this->request->data['available_to_siblings'] = 0;
        }

        //If this attribute is not present it will fail empty check
        if(!isset($this->request->data['nasname'])){
            $this->request->data['nasname'] = ''; //Make it empty if not present
        }

        //We need to see what the connection type was that was chosen
        $connection_type = 'direct'; //Default
        if(isset($this->request->data['connection_type'])){
            if($this->request->data['connection_type'] == 'openvpn'){   //Add the OpenVPN item
                $d = array();
                $d['OpenvpnClient']['username'] = $this->request->data['vpn_username'];
                $d['OpenvpnClient']['password'] = $this->request->data['vpn_password'];
                $this->Na->OpenvpnClient->create();
                if(!$this->Na->OpenvpnClient->save($d)){
                    $first_error = reset($this->Na->OpenvpnClient->validationErrors);
                    $this->set(array(
                        'errors'    => $this->Na->OpenvpnClient->validationErrors,
                        'success'   => false,
                        'message'   => array('message' => 'Could not create OpenVPN Client <br>'.$first_error[0]),
                        '_serialize' => array('errors','success','message')
                    ));
                    return;
                }else{
                    //Derive the nasname (ip address) from the new OpenvpnClient entry
                    $qr = $this->Na->OpenvpnClient->findById($this->Na->OpenvpnClient->id);
                    //IP Address =
                    $nasname = Configure::read('openvpn.ip_half').$qr['OpenvpnClient']['subnet'].'.'.$qr['OpenvpnClient']['peer1'];
                    $this->request->data['nasname'] = $nasname;
                }
            }
        }

        if(isset($this->request->data['connection_type'])){
            if($this->request->data['connection_type'] == 'dynamic'){   //Add discover the next dynamic-<number>

                $qr = $this->Na->find('first',array('conditions' => array('Na.nasname LIKE' => 'dynamic-%'), 'order' => 'Na.nasname DESC'));
                if($qr == ''){
                    $this->request->data['nasname'] = 'dynamic-1';
                }else{
                    $last_id = $qr['Na']['nasname'];
                    $last_nr = preg_replace('/^dynamic-/', "", $last_id);
                    //See if there are not any holes:
                    $start_id = 1;
                    $hole_flag = false;
                    while($start_id < $last_nr){
                        $nn = 'dynamic-'.$start_id;
                        $count = $this->Na->find('count', array('conditions' => array('Na.nasname' => $nn))); //This name is missing; we can take it
                        if($count == 0){
                            $this->request->data['nasname'] = $nn; 
                            $hole_flag = true;
                            break;
                        }
                        $start_id++;
                    }
                    if(!$hole_flag){ //There was no gap; take the next number
                        $this->request->data['nasname'] = 'dynamic-'.($last_nr+1);
                    }     
                }   
            }
        }

        $this->{$this->modelClass}->create();
        //print_r($this->request->data);
        if ($this->{$this->modelClass}->save($this->request->data)) {

            

            //Check if we need to add na_realms table
            if(isset($this->request->data['avail_for_all'])){
            //Available to all does not add any na_realm entries
            }else{
                foreach(array_keys($this->request->data) as $key){
                    if(preg_match('/^\d+/',$key)){
                        //----------------
                        $this->_add_nas_realm($this->{$this->modelClass}->id,$key);
                        //-------------
                    }
                }
            }

            //If it was an OpenvpnClient we need to update the na_id field
            if($this->request->data['connection_type'] == 'openvpn'){
                $this->Na->OpenvpnClient->saveField('na_id', $this->{$this->modelClass}->id);
            }
          
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        } else {
            //If it was an OpenvpnClient we need to remove the created openvpnclient entry since there was a failure
            if($this->request->data['connection_type'] == 'openvpn'){
                $this->Na->OpenvpnClient->delete();
            }

            $first_error = reset($this->{$this->modelClass}->validationErrors);
            $this->set(array(
                'errors'    => $this->{$this->modelClass}->validationErrors,
                'success'   => false,
                'message'   => array('message' => __('Could not create item').' <br>'.$first_error[0]),
                '_serialize' => array('errors','success','message')
            ));
        }

	}

    public function manage_tags(){

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];


        $tag_id = $this->request->data['tag_id'];
        $rb     = $this->request->data['rb'];

        foreach(array_keys($this->request->data) as $key){
            if(preg_match('/^\d+/',$key)){
                //----------------
                if($rb == 'add'){
                    $this->_add_nas_tag($key,$tag_id);
                }
                if($rb == 'remove'){
                    $this->Na->NaTag->deleteAll(array('NaTag.na_id' => $key,'NaTag.tag_id' => $tag_id), false);
                }
                //-------------
            }
        }
     
        $this->set(array(
                'success' => true,
                '_serialize' => array('success')
        ));
    }

    public function edit() {

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];  

        //We will not modify user_id
        unset($this->request->data['user_id']);

		if ($this->Realm->save($this->request->data)) {
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        }else{
             $this->set(array(
                'success' => false,
                '_serialize' => array('success')
            ));

        }
	}


    public function delete($id = null) {
		if (!$this->request->is('post')) {
			throw new MethodNotAllowedException();
		}

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];  

	    if(isset($this->data['id'])){   //Single item delete
            $message = __("Single item")." ".$this->data['id'];
            $this->Realm->id = $this->data['id'];
            $this->Realm->delete();
      
        }else{                          //Assume multiple item delete
            foreach($this->data as $d){
                $this->Realm->id = $d['id'];
                $this->Realm->delete();
            }
        }

        $this->set(array(
            'success' => true,
            '_serialize' => array('success')
        ));
	}


    public function note_index(){

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];

        $items = array();
        if(isset($this->request->query['for_id'])){
            $na_id  = $this->request->query['for_id'];
            $q_r    = $this->Na->NaNote->find('all', 
                array(
                    'contain'       => array('Note'),
                    'conditions'    => array('NaNote.na_id' => $na_id)
                )
            );
            $this->User = ClassRegistry::init('User');
            foreach($q_r as $i){
                if(!$this->_test_for_private_parent($i['Note'],$user)){
                    $owner_id   = $i['Note']['user_id'];
                    $owner      = $this->_find_parents($owner_id);
                    $afs        = $this->_get_action_flags($owner_id,$user);
                    array_push($items,
                        array(
                            'id'        => $i['Note']['id'], 
                            'note'      => $i['Note']['note'], 
                            'available_to_siblings' => $i['Note']['available_to_siblings'],
                            'owner'     => $owner,
                            'delete'    => $afs['delete']
                        )
                    );
                }
            }
        } 
        $this->set(array(
            'items'     => $items,
            'success'   => true,
            '_serialize'=> array('success', 'items')
        ));
    }

    public function note_add(){

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $user_id    = $user['id'];

        //Get the creator's id
        if($this->request->data['user_id'] == '0'){ //This is the holder of the token - override '0'
            $this->request->data['user_id'] = $user_id;
        }

        //Make available to siblings check
        if(isset($this->request->data['available_to_siblings'])){
            $this->request->data['available_to_siblings'] = 1;
        }else{
            $this->request->data['available_to_siblings'] = 0;
        }

        $success    = false;
        $msg        = array('message' => __('Could not create note'));
        $this->Na->NaNote->Note->create(); 
        //print_r($this->request->data);
        if ($this->Na->NaNote->Note->save($this->request->data)) {
            $d                      = array();
            $d['NaNote']['na_id']   = $this->request->data['for_id'];
            $d['NaNote']['note_id'] = $this->Na->NaNote->Note->id;
            $this->Na->NaNote->create();
            if ($this->Na->NaNote->save($d)) {
                $success = true;
            }
        }

        if($success){
            $this->set(array(
                'success' => $success,
                '_serialize' => array('success')
            ));
        }else{
             $this->set(array(
                'success' => $success,
                'message' => $message,
                '_serialize' => array('success','message')
            ));
        }
    }

    public function note_del(){

        if (!$this->request->is('post')) {
			throw new MethodNotAllowedException();
		}

        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }

        $user_id    = $user['id'];
        $this->User = ClassRegistry::init('User');
        $fail_flag  = false;

	    if(isset($this->data['id'])){   //Single item delete
            $message = "Single item ".$this->data['id'];

            //NOTE: we first check of the user_id is the logged in user OR a sibling of them:   
            $item       = $this->Na->NaNote->Note->findById($this->data['id']);
            $owner_id   = $item['Note']['user_id'];
            if($owner_id != $user_id){
                if($this->_is_sibling_of($user_id,$owner_id)== true){
                    $this->Na->NaNote->Note->id = $this->data['id'];
                    $this->Na->NaNote->Note->delete($this->data['id'],true);
                }else{
                    $fail_flag = true;
                }
            }else{
                $this->Na->NaNote->Note->id = $this->data['id'];
                $this->Na->NaNote->Note->delete($this->data['id'],true);
            }
   
        }else{                          //Assume multiple item delete
            foreach($this->data as $d){

                $item       = $this->Na->NaNote->Note->findById($d['id']);
                $owner_id   = $item['Note']['user_id'];
                if($owner_id != $user_id){
                    if($this->_is_sibling_of($user_id,$owner_id) == true){
                        $this->Na->NaNote->Note->id = $d['id'];
                        $this->Na->NaNote->Note->delete($d['id'],true);
                    }else{
                        $fail_flag = true;
                    }
                }else{
                    $this->Na->NaNote->Note->id = $d['id'];
                    $this->Na->NaNote->Note->delete($d['id'],true);
                }
   
            }
        }

        if($fail_flag == true){
            $this->set(array(
                'success'   => false,
                'message'   => array('message' => __('Could not delete some items')),
                '_serialize' => array('success','message')
            ));
        }else{
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        }

    }

//------------------ EXPERIMENTAL WORK --------------------------

    public function display_realms_and_users($id = 0){

        if(isset($this->request->query['id'])){
            $id = $this->request->query['id'];
        }

        $items = array();

        if($id == 0){ //the root node
            $q = $this->{$this->modelClass}->find('all', array(
                'contain' => array('User' => array('fields' => 'User.id'))
            ));

            foreach($q as $i){
                //We will precede the id with 'grp_'
                $total_users = count($i['User']);

                $i[$this->modelClass]['qtip'] = $total_users." users<br>4 online";
                $i[$this->modelClass]['text'] = $i[$this->modelClass]['name'];
               // $i[$this->modelClass]['id']   = 'grp_'.$i[$this->modelClass]['id'];
              //  $i[$this->modelClass]['leaf'] = true;
                $total_users = count($i['User']);
                array_push($items,$i[$this->modelClass]);
            }

        }else{
            $q = $this->{$this->modelClass}->find('first', array(
                'conditions'    => array('Realm.id' => $id),
                'contain'       => array('User')
            ));
            foreach($q['User'] as $i){

                array_push($items, array('id' => $i['id'],'text' => $i['username'], 'leaf'=> true));
            }
            $count = 10;
            while($count < 20000){
                array_push($items, array('id' => $count,'text' => "Number $count", 'leaf'=> true));
                $count++;
            }
        }

        $this->set(array(
            'items' => $items,
            'success' => true,
            '_serialize' => array('items','success')
        ));
    }

//------------------ END EXPERIMENTAL WORK ------------------------------

    //______ EXT JS UI functions ___________

    //------ List of available connection types ------
    //This is displayed as options when a user adds a new NAS device
    public function conn_types_available(){

        $items = array();

        $ct = Configure::read('conn_type');
        foreach($ct as $i){
            if($i['active']){
                array_push($items, $i);
            }
        }

        $this->set(array(
            'items' => $items,
            'success' => true,
            '_serialize' => array('items','success')
        ));
    }

    //------ List of configured dynamic attributes types ------
    //This is displayed as a select to choose from when the user adds a NAS of connection type 
    public function dynamic_attributes(){
        $items = array();
        $ct = Configure::read('dynamic_attributes');
        foreach($ct as $i){
            if($i['active']){
                array_push($items, $i);
            }
        }

        $this->set(array(
            'items' => $items,
            'success' => true,
            '_serialize' => array('items','success')
        ));
    }

    //----- Menus ------------------------
    public function menu_for_grid(){

        $user = $this->Aa->user_for_token($this);
        if(!$user){   //If not a valid user
            return;
        }

        //Empty by default
        $menu = array();

        //Admin => all power
        if($user['group_name'] == Configure::read('group.admin')){  //Admin

            $menu = array(
                array('xtype' => 'buttongroup','title' => __('Action'), 'items' => array(
                    array('xtype' => 'button', 'iconCls' => 'b-reload',  'scale' => 'large', 'itemId' => 'reload',   'tooltip'=> __('Reload')),
                    array('xtype' => 'button', 'iconCls' => 'b-add',     'scale' => 'large', 'itemId' => 'add',      'tooltip'=> __('Add')),
                    array('xtype' => 'button', 'iconCls' => 'b-delete',  'scale' => 'large', 'itemId' => 'delete',   'tooltip'=> __('Delete')),
                    array('xtype' => 'button', 'iconCls' => 'b-edit',    'scale' => 'large', 'itemId' => 'edit',     'tooltip'=> __('Edit'))
                )),
                array('xtype' => 'buttongroup','title' => __('Document'), 'items' => array(
                    array('xtype' => 'button', 'iconCls' => 'b-note',     'scale' => 'large', 'itemId' => 'note',     'tooltip'=> __('Add notes')),
                    array('xtype' => 'button', 'iconCls' => 'b-csv',     'scale' => 'large', 'itemId' => 'csv',      'tooltip'=> __('Export CSV')),
                )),
                array('xtype' => 'buttongroup','title' => __('Nas'), 'items' => array(
                    array('xtype' => 'button', 'iconCls' => 'b-meta_edit','scale' => 'large', 'itemId' => 'tag',     'tooltip'=> __('Manage tags')),
                    array('xtype' => 'button', 'iconCls' => 'b-map',     'scale' => 'large', 'itemId' => 'map',      'tooltip'=> __('Map'))
                )) 
            );
        }

        //AP depend on rights
        if($user['group_name'] == Configure::read('group.ap')){ //AP (with overrides)

            $id             = $user['id'];
            $action_group   = array();
            $document_group = array();
            $specific_group = array();
            array_push($action_group,array(  
                'xtype'     => 'button',
                'iconCls'   => 'b-reload',  
                'scale'     => 'large', 
                'itemId'    => 'reload',   
                'tooltip'   => __('Reload')));

            //Add
            if($this->Acl->check(array('model' => 'User', 'foreign_key' => $id), $this->base."add")){
                array_push($action_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-add',     
                    'scale'     => 'large', 
                    'itemId'    => 'add',      
                    'tooltip'   => __('Add')));
            }
            //Delete
            if($this->Acl->check(array('model' => 'User', 'foreign_key' => $id), $this->base.'delete')){
                array_push($action_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-delete',  
                    'scale'     => 'large', 
                    'itemId'    => 'delete',
                    'disabled'  => true,   
                    'tooltip'   => __('Delete')));
            }

            //Edit
            if($this->Acl->check(array('model' => 'User', 'foreign_key' => $id), $this->base.'edit')){
                array_push($action_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-edit',    
                    'scale'     => 'large', 
                    'itemId'    => 'edit',
                    'disabled'  => true,     
                    'tooltip'   => __('Edit')));
            }

            if($this->Acl->check(array('model' => 'User', 'foreign_key' => $id), $this->base.'note_index')){ //Change FIXME
                array_push($document_group,array(
                        'xtype'     => 'button', 
                        'iconCls'   => 'b-note',     
                        'scale'     => 'large', 
                        'itemId'    => 'note',      
                        'tooltip'   => __('Add Notes')));
            }


            array_push($document_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-csv',     
                    'scale'     => 'large', 
                    'itemId'    => 'csv',      
                    'tooltip'   => __('Export CSV')));

            //Tags
            if($this->Acl->check(array('model' => 'User', 'foreign_key' => $id), $this->base.'manage_tags')){
                array_push($specific_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-meta_edit',    
                    'scale'     => 'large', 
                    'itemId'    => 'tag',
                    'disabled'  => true,     
                    'tooltip'=> __('Manage tags')));
            }

            array_push($specific_group,array(
                    'xtype'     => 'button', 
                    'iconCls'   => 'b-map',     
                    'scale'     => 'large', 
                    'itemId'    => 'map',      
                    'tooltip'   => __('Maps')));

           // array_push($menu,array('xtype' => 'tbfill'));

            $menu = array(
                        array('xtype' => 'buttongroup','title' => __('Action'),        'items' => $action_group),
                        array('xtype' => 'buttongroup','title' => __('Document'),   'items' => $document_group),
                        array('xtype' => 'buttongroup','title' => __('Nas'),        'items' => $specific_group)
                    );
        }
        $this->set(array(
            'items'         => $menu,
            'success'       => true,
            '_serialize'    => array('items','success')
        ));
    }

    //______ END EXT JS UI functions ________

    private function _find_parents($id){

        $this->User->contain();//No dependencies
        $q_r        = $this->User->getPath($id);
        $path_string= '';
        if($q_r){

            foreach($q_r as $line_num => $i){
                $username       = $i['User']['username'];
                if($line_num == 0){
                    $path_string    = $username;
                }else{
                    $path_string    = $path_string.' -> '.$username;
                }
            }
            if($line_num > 0){
                return $username." (".$path_string.")";
            }else{
                return $username;
            }
        }else{
            return __("orphaned");
        }
    }

    private function _add_nas_realm($nas_id,$realm_id){
        $d                          = array();
        $d['NaRealm']['id']         = '';
        $d['NaRealm']['na_id']      = $nas_id;
        $d['NaRealm']['realm_id']   = $realm_id;

        $this->Na->NaRealm->create();
        $this->Na->NaRealm->save($d);
        $this->Na->NaRealm->id      = false;
    }

    private function _add_nas_tag($nas_id,$tag_id){
        //Delete any previous tags if there were any
        $this->Na->NaTag->deleteAll(array('NaTag.na_id' => $nas_id,'NaTag.tag_id' => $tag_id), false);
        $d                      = array();
        $d['NaTag']['id']       = '';
        $d['NaTag']['na_id']    = $nas_id;
        $d['NaTag']['tag_id']   = $tag_id;
        $this->Na->NaTag->create();
        $this->Na->NaTag->save($d);
        $this->Na->NaTag->id    = false;
    }

    private function _get_action_flags($owner_id,$user){
        if($user['group_name'] == Configure::read('group.admin')){  //Admin
            return array('update' => true, 'delete' => true ,'manage_tags' => true);
        }

        if($user['group_name'] == Configure::read('group.ap')){  //AP
            $user_id = $user['id'];

            //test for self
            if($owner_id == $user_id){
                return array('update' => true, 'delete' => true ,'manage_tags' => true);
            }
            //Test for Parents
            foreach($this->parents as $i){
                if($i['User']['id'] == $owner_id){
                    return array('update' => false, 'delete' => false ,'manage_tags' => false);
                }
            }

            //Test for Children
            foreach($this->children as $i){
                if($i['User']['id'] == $owner_id){
                    return array('update' => true, 'delete' => true ,'manage_tags' => true);
                }
            }  
        }
    }

    function _build_common_query($user){

        //Empty to start with
        $c                  = array();
        $c['joins']         = array(); 
        $c['conditions']    = array();

        //What should we include....
        $c['contain']   = array(
                            'NaRealm'   => array('Realm.name','Realm.id','Realm.available_to_siblings','Realm.user_id'),
                            'NaTag'     => array('Tag.name','Tag.id','Tag.available_to_siblings','Tag.user_id'),
                            'NaNote'    => array('Note.note','Note.id','Note.available_to_siblings','Note.user_id'),
                            'User'
                        );

        //===== SORT =====
        //Default values for sort and dir
        $sort   = 'nasname';
        $dir    = 'DESC';

        if(isset($this->request->query['sort'])){
            if($this->request->query['sort'] == 'owner'){
                $sort = 'User.username';
            }else{
                $sort = $this->modelClass.'.'.$this->request->query['sort'];
            }
            $dir  = $this->request->query['dir'];
        } 
        $c['order'] = array("$sort $dir");
        //==== END SORT ===


        //====== REQUEST FILTER =====
        if(isset($this->request->query['filter'])){
            $filter = json_decode($this->request->query['filter']);
            foreach($filter as $f){
                //Lists
                if($f->type == 'list'){

                    //The tags field has to be treated specially
                    if($f->field == 'tags'){

                        $list_array = array();
                        foreach($f->value as $filter_list){
                            $col = 'Tag.name';
                            array_push($list_array,array("$col" => "$filter_list"));
                        }
                        array_push($c['joins'],array(
                            'table'         => 'na_tags',
                            'alias'         => 'NaTag',
                            'type'          => 'INNER',
                            'conditions'    => array('NaTag.na_id = Na.id')
                        ));
                        array_push($c['joins'],array(
                            'table'         => 'tags',
                            'alias'         => 'Tag',
                            'type'          => 'INNER',
                            'conditions'    => array('Tag.id = NaTag.tag_id',array('OR' => $list_array))
                        ));

                    }elseif($f->field == 'realms'){
                        $list_array = array();
                        foreach($f->value as $filter_list){
                            $col = 'Realm.name';
                            array_push($list_array,array("$col" => "$filter_list"));
                        }
                        array_push($c['joins'],array(
                            'table'         => 'na_realms',
                            'alias'         => 'NaRealm',
                            'type'          => 'INNER',
                            'conditions'    => array('NaRealm.na_id = Na.id')
                        ));
                        array_push($c['joins'],array(
                            'table'         => 'realms',
                            'alias'         => 'Realm',
                            'type'          => 'INNER',
                            'conditions'    => array('Realm.id = NaRealm.realm_id',array('OR' => $list_array))
                        ));                     
                    }else{
                        $list_array = array();
                        foreach($f->value as $filter_list){
                            $col = $this->modelClass.'.'.$f->field;
                            array_push($list_array,array("$col" => "$filter_list"));
                        }
                        //Add it as an OR condition
                        array_push($c['conditions'],array('OR' => $list_array));
                    }
                }
                //Strings
                if($f->type == 'string'){
                    if($f->field == 'owner'){
                        array_push($c['conditions'],array("User.username LIKE" => '%'.$f->value.'%'));   
                    }else{
                        $col = $this->modelClass.'.'.$f->field;
                        array_push($c['conditions'],array("$col LIKE" => '%'.$f->value.'%'));
                    }
                }
                //Bools
                if($f->type == 'boolean'){
                     $col = $this->modelClass.'.'.$f->field;
                     array_push($c['conditions'],array("$col" => $f->value));
                }
            }
        }
        //====== END REQUEST FILTER =====

        //====== AP FILTER =====
        //If the user is an AP; we need to add an extra clause to only show the NAS devices which he is allowed to see.
        if($user['group_name'] == Configure::read('group.ap')){  //AP
            $tree_array = array();
            $this->User = ClassRegistry::init('User');
            $user_id    = $user['id'];

            //**AP and upward in the tree**
            $this->parents = $this->User->getPath($user_id,'User.id');
            //So we loop this results asking for the parent nodes who have available_to_siblings = true
            foreach($this->parents as $i){
                $i_id = $i['User']['id'];
                if($i_id != $user_id){ //upstream
                    array_push($tree_array,array('Na.user_id' => $i_id,'Na.available_to_siblings' => true));
                }else{
                    array_push($tree_array,array('Na.user_id' => $i_id));
                }
            }
            //** ALL the AP's children
            $this->children   = $this->User->children($user_id,false,'User.id');
            foreach($this->children as $i){
                $i_id = $i['User']['id'];
                array_push($tree_array,array('Na.user_id' => $i_id));
            }      
            //Add it as an OR clause
            array_push($c['conditions'],array('OR' => $tree_array));  
        }       
        //====== END AP FILTER =====      
        return $c;
    }

    private function _is_sibling_of($parent_id,$user_id){
        $this->User->contain();//No dependencies
        $q_r        = $this->User->getPath($user_id);
        foreach($q_r as $i){
            $id = $i['User']['id'];
            if($id == $parent_id){
                return true;
            }
        }
        //No match
        return false;
    }

}
