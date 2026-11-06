using Microsoft.Data.SqlClient;
using System.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}