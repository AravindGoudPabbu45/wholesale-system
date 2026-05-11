$tokens = Get-Content auth_tokens.json | ConvertFrom-Json;
$t_ret = $tokens.retailer1;
$t_ord = $tokens.emp_orders1;
$t_wh = $tokens.emp_warehouse1;
$t_log = $tokens.emp_logistics1;

try {
    # 2. Retailer places order (Branch 2 is Hyd)
    $orderBody = @{ branchId = 2; notes = "Test order"; items = @( @{ productId = 2; quantity = 10 }, @{ productId = 3; quantity = 5 } ) } | ConvertTo-Json;
    $o_res = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Headers @{Authorization="Bearer $t_ret"} -Method Post -ContentType "application/json" -Body $orderBody;
    Write-Host "Order Created: $($o_res.orderNumber)";
    $oid = $o_res.id;
    
    # 3. Orders approves
    Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$oid/status" -Headers @{Authorization="Bearer $t_ord"} -Method Put -ContentType "application/json" -Body '{"status":"APPROVED"}';
    Write-Host "Order Approved";
    
    # 5. Warehouse packs
    Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$oid/status" -Headers @{Authorization="Bearer $t_wh"} -Method Put -ContentType "application/json" -Body '{"status":"PACKED"}';
    Write-Host "Order Packed";
    
    # 6. Logistics Ships
    Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$oid/status" -Headers @{Authorization="Bearer $t_log"} -Method Put -ContentType "application/json" -Body '{"status":"SHIPPED"}';
    Write-Host "Order Shipped";
    
    # 7. Logistics delivers
    Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$oid/status" -Headers @{Authorization="Bearer $t_log"} -Method Put -ContentType "application/json" -Body '{"status":"DELIVERED"}';
    Write-Host "Order Delivered";
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response: $($reader.ReadToEnd())"
    }
}
