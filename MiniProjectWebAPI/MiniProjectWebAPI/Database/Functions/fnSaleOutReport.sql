CREATE
OR ALTER FUNCTION dbo.fnSaleOutReport (@StartDate INT, @EndDate INT) RETURNS TABLE AS RETURN (
    SELECT
        COALESCE(p.ProductCode, N'') AS ProductCode,
        COALESCE(p.ProductName, N'') AS ProductName,
        SUM(COALESCE(s.Quantity, 0)) AS Quantity,
        SUM(COALESCE(s.Amount, 0)) AS Amount
    FROM
        dbo.SaleOut AS s
        LEFT JOIN dbo.MasterProduct AS p ON p.Id = s.ProductId
    WHERE
        s.OrderDate >= @StartDate
        AND s.OrderDate <= @EndDate
    -- Nhóm theo ProductId để sản phẩm khác nhau vẫn tách dòng khi mã/tên trùng hoặc thiếu.
    GROUP BY
        s.ProductId,
        p.ProductCode,
        p.ProductName
);
