package quak.annotation;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import quak.http.ConnectionManager;
import quak.http.UserBean;

import com.google.gson.Gson;

/**
 * Servlet implementation class Loader
 */
@WebServlet("/Loader")
public class Loader extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Loader() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		request.setCharacterEncoding("utf8");
		response.setCharacterEncoding("utf8");
		Gson files_gson = new Gson();
		
		HttpSession session = request.getSession(false);
		String username = null;
		if (session != null && session.getAttribute("user") != null)
		{
			UserBean user = (UserBean) session.getAttribute("user");
			username = user.getUsername();
		}
		Enumeration<String> att_list = request.getAttributeNames();
		while (att_list.hasMoreElements()) {
			System.err.println(att_list.nextElement());
		}
		String bundle_id = (String) request.getAttribute("bundle_id");
		String sentence_id = (String) request.getAttribute("sentence_id");
		
		String graph = getFromDB(username, bundle_id, sentence_id);

		response.setContentType("application/json");
		response.getWriter().print(files_gson.toJson(graph));
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}
	
	private String getFromDB(String username, String bundle_id, String sentence_id) {
		Connection currentCon = ConnectionManager.getConnection();
		PreparedStatement stmt;
		
		try {
			String pstmt = "SELECT graph, time FROM results WHERE username=? AND annotation_bundle=? AND sentence=?";
			stmt = currentCon.prepareStatement(pstmt);
			
			stmt.setString(1, username);
			stmt.setString(2, bundle_id);
			stmt.setString(3, sentence_id);
			System.err.println("querying for " + username + " " + bundle_id + " " + sentence_id);
			String graph = null;
			Date date = new Date(0, 0, 1);
			ResultSet result = stmt.executeQuery();
			while (result.next()) {
				Date this_time = result.getTimestamp("time");
				System.err.println(this_time.toGMTString());
				System.err.println(result.getString("graph"));
				if (this_time.after(date))
				{
					date = result.getTimestamp("time");
					graph = result.getString("graph");
				}
			}
			System.err.println("loaded annotation from " + date.toGMTString());
			return graph;

		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return "";
	}

}
