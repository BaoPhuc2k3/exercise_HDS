using System;
using System.Data;
using Microsoft.Data.SqlClient;


public sealed class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(IConfiguration configuration)   
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' chưa được cấu hình.");
    }
    
    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

}