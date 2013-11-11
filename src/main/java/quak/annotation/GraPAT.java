package quak.annotation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import quak.http.ConnectionManager;
import quak.http.UserBean;

import com.google.gson.Gson;
//import com.mysql.jdbc.PreparedStatement;

/**
 * Servlet implementation class GraPAT
 */
@WebServlet("/GraPAT")
public class GraPAT extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static Connection currentCon = null;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GraPAT() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		response.setCharacterEncoding("utf8");
		request.getRequestDispatcher("WEB-INF/jsp/grapat.jsp").forward(request, response);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf8");
		
		HttpSession session = request.getSession(false);
		
		if (request.getParameter("graph") == null)
		{
			response.getWriter().print("null");
			response.flushBuffer();
		}
		String result = request.getParameter("graph");
		String annotation_bundle = request.getParameter("annotation_bundle");
		String sentence = request.getParameter("sentence");
		// String path = "/home/grapat/save/sentiment/";
		String username = "unknown";
		System.err.println( session.getAttribute("user"));
		if (session != null && session.getAttribute("user") != null)
		{
			UserBean user = (UserBean) session.getAttribute("user");
			username = user.getUsername();
		}
		
		writeToDB(result, username, annotation_bundle, sentence);

	}
	
	private void writeToDB(String result, String username, String annotation_bundle, String sentence) {
		currentCon = ConnectionManager.getConnection();
		Statement stmt;
		try {
			stmt = currentCon.createStatement();
			
			// String time = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
			Timestamp time = new Timestamp(new Date().getTime());
			// create table if it doesnt exist
			stmt.execute("CREATE TABLE IF NOT EXISTS " + "results" + 
					" ("
					+ "`id` int(11) NOT NULL AUTO_INCREMENT, "
					+ "`username` text , "
					+ "`annotation_bundle` text , "
					+ "`sentence` text , "
					+ "`graph` longtext, "
					+ "`time` TIMESTAMP," +
					" PRIMARY KEY (`id`)) DEFAULT CHARSET=utf8");
			String prep_insert = "INSERT INTO results SET "
					+ "username = ?,"
					+ "annotation_bundle = ?,"
					+ "sentence = ?,"
					+ "graph = ?,"
					+ "time = ?";
			final PreparedStatement pstmt = currentCon.prepareStatement(prep_insert);
			//String insert = "INSERT into " + "results" + "(username, graph, time) VALUES (\"" + username + "\",\"" + result + "\",\"" + time + "\")";
			pstmt.setString(1, username);
			pstmt.setString(2, annotation_bundle);
			pstmt.setString(3, sentence);
			pstmt.setString(4, result);
			pstmt.setTimestamp(5, time);
			
			pstmt.execute();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}

}

