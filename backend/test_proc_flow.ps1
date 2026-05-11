$tokens = Get-Content auth_tokens.json | ConvertFrom-Json;
$t_proc = $tokens.emp_procurement1;
$t_sup = $tokens.supplier2;

try {
    # 1. Procurement Creates Order (Branch 2 Hyd wants product 1 from Supplier 2)
    $procBody = @{ branchId = 2; supplierId = 2; productId = 1; quantity = 50; expectedDate = "2026-05-01"; notes = "Restock test" } | ConvertTo-Json;
    $po_res = Invoke-RestMethod -Uri "http://localhost:8080/api/procurement" -Headers @{Authorization="Bearer $t_proc"} -Method Post -ContentType "application/json" -Body $procBody;
    Write-Host "Procurement Order Created: $($po_res.id)";
    $poid = $po_res.id;
    
    # Send to Supplier
    Invoke-RestMethod -Uri "http://localhost:8080/api/procurement/$poid/status?status=SENT" -Headers @{Authorization="Bearer $t_proc"} -Method Put;
    Write-Host "Procurement SENT";
    
    # 2. Supplier Accepts
    Invoke-RestMethod -Uri "http://localhost:8080/api/procurement/$poid/status?status=ACCEPTED" -Headers @{Authorization="Bearer $t_sup"} -Method Put;
    Write-Host "Procurement ACCEPTED";
    
    # 3. Supplier Dispatches
    Invoke-RestMethod -Uri "http://localhost:8080/api/procurement/$poid/status?status=DISPATCHED" -Headers @{Authorization="Bearer $t_sup"} -Method Put;
    Write-Host "Procurement DISPATCHED";
    
    # 4. Procurement Delivers (Increases Inventory)
    Invoke-RestMethod -Uri "http://localhost:8080/api/procurement/$poid/status?status=DELIVERED" -Headers @{Authorization="Bearer $t_proc"} -Method Put;
    Write-Host "Procurement DELIVERED";

} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response: $($reader.ReadToEnd())"
    }
}
