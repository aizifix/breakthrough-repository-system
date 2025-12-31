<?php
// Test script to check the get_repositories API endpoint
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'http://localhost/repository-api/api/general.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'operation' => 'get_repositories',
    'categories' => [],
    'keywords' => '',
    'yearFrom' => '',
    'yearTo' => ''
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Response:\n";
echo $response . "\n";

// Decode and pretty print
$data = json_decode($response, true);
if ($data) {
    echo "\nDecoded response:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
}
?>