<?php
// Code taken from http://www.php.net/manual/en/ldap.examples-basic.php, adapted to CERN

$ds=ldap_connect("xldap.cern.ch"); 

if ($ds) { 
    
    $r=ldap_bind($ds);
    
    //trim "CERN\" from the username
    $username = substr_replace($_SERVER["REMOTE_USER"],'',0,5); 
    
    $sr=ldap_search($ds,"OU=Users,OU=Organic Units,DC=cern,DC=ch", "CN=".$username);  
    
    $info = ldap_get_entries($ds, $sr);

    for ($i=0; $i<$info["count"]; $i++) {

        $data = array('user' => $info[$i]["cn"][0],
            'name' => $info[$i]["givenname"][0],
            'surname' => $info[$i]["sn"][0],
            'mail' => $info[$i]["mail"][0],
            'institute' => $info[$i]["cerninstitutename"][0],
            'cernid' => $info[$i]["employeeid"][0]);
        
        echo json_encode($data);
    }
    ldap_close($ds);
}
else echo "Fail";

?>​