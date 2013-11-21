package quak.annotation;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;

/**
 * Servlet implementation class ResourceHandler
 */
@WebServlet("/ResourceHandler")
public class ResourceHandler extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ResourceHandler() {
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
		
		Map<String, String> fileMap = new HashMap<String, String>();
		fileMap.put("1", "Demo");
		fileMap.put("2", "EU-Schweiz");
		
		try {
			URL defaultImage = ResourceHandler.class.getResource("data/EU-Schweiz");
			File imageFile = new File(defaultImage.toURI());
			System.err.println(imageFile.getAbsolutePath());
			System.err.println(imageFile.getName());			
		} catch (Exception e) {
			System.err.println(e.getStackTrace());
		}
		
		File[] source_files = get_files(".");
		for (File file : source_files) {
			System.err.println(file.getAbsolutePath());
			System.err.println(file.getName());
		}

		response.setContentType("application/json");
		response.getWriter().print(files_gson.toJson(fileMap));
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

	private File[] get_files(String directory_name) {
		File dir = new File(directory_name);
		
		return dir.listFiles();
	}
}
