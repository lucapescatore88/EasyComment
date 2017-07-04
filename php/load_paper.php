<?php

$myfile = "../papers/".$_GET["paper"].".json";

//print_r(get_defined_vars());

if (file_exists($myfile)) 
{
    echo file_get_contents($myfile);
}
else 
{
    $fh = fopen($myfile, 'w');
    fwrite($fh,"[]");
    fclose($fh);
    echo "New file created";
}

?>