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
        echo "User: " . $info[$i]["cn"][0] . "<br />";
        echo "Cern ID: " . $info[$i]["employeeid"][0] . "<br />";
        echo "First name: " . $info[$i]["givenname"][0] . "<br />";
        echo "Last name: " . $info[$i]["sn"][0] . "<br />";
        echo "Email: " . $info[$i]["mail"][0] . "<br />";   
        echo "Institute: ". $info[$i]["cerninstitutename"][0];  
    }

    ldap_close($ds);
} 
else echo "Fail";
echo "\n";
?>​