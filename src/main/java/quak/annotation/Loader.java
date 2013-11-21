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

class DBAnswer {
	public DBAnswer(){};
	public String graph;
	public String layout;
}

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
		
		
		String bundle_id = request.getParameter("bundle_id");
		String sentence_id = request.getParameter("sentence_id");
		System.err.println(bundle_id);
		  StringBuilder sb = new StringBuilder();
		  Enumeration<String> parameterNames = request.getParameterNames();	
		  while (parameterNames.hasMoreElements()) {
		      String parameterName = parameterNames.nextElement();
		      sb.append(parameterName);
		      sb.append(" : ");
		      sb.append(request.getParameter(parameterName));
		  			
		      if (parameterNames.hasMoreElements()) {
		          sb.append(", ");
		      }
		  }
		  System.err.println(sb.toString());

		
		
		HttpSession session = request.getSession(false);
		String username = null;
		if (session != null && session.getAttribute("user") != null)
		{
			UserBean user = (UserBean) session.getAttribute("user");
			username = user.getUsername();
		}		
		DBAnswer save = getFromDB(username, bundle_id, sentence_id);
		
		Gson gson = new Gson();
		response.setContentType("application/json");
		response.getWriter().print( "{\"graph\" : " + gson.toJson(save.graph) + ", \"layout\" : " + gson.toJson(save.layout) + "}");
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}
	
	private DBAnswer getFromDB(String username, String bundle_id, String sentence_id) {
		Connection currentCon = ConnectionManager.getConnection();
		PreparedStatement stmt;
		
		try {
			String pstmt = "SELECT graph, time, layout FROM results WHERE username=? AND annotation_bundle=? AND sentence=?";
			stmt = currentCon.prepareStatement(pstmt);
			
			stmt.setString(1, username);
			stmt.setString(2, bundle_id);
			stmt.setString(3, sentence_id);
			System.err.println("querying for " + username + " " + bundle_id + " " + sentence_id);
			String graph = null;
			String layout = null;
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
					layout = result.getString("layout");
				}
			}
			System.err.println("loaded annotation from " + date.toGMTString());
			DBAnswer res = new DBAnswer();
			res.graph = graph;
			res.layout = layout;
			return res;

		} catch (SQLException e) {
			// TODO Auto-generated catch block
			// e.printStackTrace();
		}
		
		return null;
	}

}
