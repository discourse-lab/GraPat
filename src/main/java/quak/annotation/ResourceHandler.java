package quak.annotation;

import java.io.IOException;
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

class FileInfo {
	private String filename;
	public FileInfo() {};
	
	public void setFilename (String value) {
		filename = value;
	}
	public String getFilename () {
		return filename;
	}
	
}

class FileList {
	private List<FileInfo> files;
	
	public FileList () {
		files = new ArrayList<FileInfo>();
	}
	
	public List<FileInfo> getFiles() {
		return files;
	}
	public void setFiles(List<FileInfo> value) {
		files = value;
	}
	public void addFile (FileInfo value) {
		files.add(value);
	}
}

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
		
		FileList files = new FileList();
		FileInfo f1 = new FileInfo();
		f1.setFilename("sentences.txt");
		FileInfo f2 = new FileInfo();
		f1.setFilename("sentencesDemo.txt");
		files.addFile(f1);
		files.addFile(f2);
		files_gson.toJson(files);
		response.setContentType("application/json");
		System.err.println(files_gson);
		response.getWriter().print(files_gson);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

}
