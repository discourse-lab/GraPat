package quak.annotation;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Collections;

import javax.servlet.ServletContext;
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
		//fileMap.put("1", "Demo");
		//fileMap.put("2", "EU-Schweiz");
		
		ServletContext context = getServletContext();
		Set<String> filesSet = context.getResourcePaths("/data/");
		List<String> files = new ArrayList(filesSet);
		Collections.sort(files);
		Integer index = 0;
		for (String file : files) {
			String[] structuredFileName = file.split("/");
			String filename = structuredFileName[structuredFileName.length - 1];
			fileMap.put(index.toString(), filename);
			++index;
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
